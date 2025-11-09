import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Email Tracking Service
 * Handles tracking pixel generation, link wrapping, and analytics
 */
export class EmailTrackingService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Generate unique tracking ID
   */
  generateTrackingId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate tracking pixel HTML
   * Creates a 1x1 transparent GIF that tracks email opens
   */
  generateTrackingPixel(emailId: number, trackingId: string): string {
    const pixelUrl = `${this.baseUrl}/api/tracking/pixel/${trackingId}`;
    return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none !important; visibility:hidden !important; opacity:0 !important; width:1px !important; height:1px !important;" />`;
  }

  /**
   * Extract all links from HTML content
   */
  extractLinks(html: string): string[] {
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      // Skip mailto:, tel:, and anchor links
      if (!url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('#')) {
        links.push(url);
      }
    }

    return links;
  }

  /**
   * Generate tracked URL with UTM parameters
   * Returns a redirect URL that goes through our click tracking endpoint
   */
  generateTrackedUrl(
    originalUrl: string,
    trackingId: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      term?: string;
    }
  ): string {
    try {
      // First, add UTM parameters to the original URL
      const url = new URL(originalUrl);
      
      if (utmParams?.source) url.searchParams.set('utm_source', utmParams.source);
      if (utmParams?.medium) url.searchParams.set('utm_medium', utmParams.medium);
      if (utmParams?.campaign) url.searchParams.set('utm_campaign', utmParams.campaign);
      if (utmParams?.content) url.searchParams.set('utm_content', utmParams.content);
      if (utmParams?.term) url.searchParams.set('utm_term', utmParams.term);
      
      const urlWithUTM = url.toString();
      
      // Now create tracking redirect URL
      // This will go through our click tracking endpoint which redirects to the original
      const trackingUrl = `${this.baseUrl}/api/tracking/click/${trackingId}?url=${encodeURIComponent(urlWithUTM)}`;
      
      return trackingUrl;
    } catch (error) {
      console.error('Error generating tracked URL:', error);
      return originalUrl;
    }
  }

  /**
   * Wrap all links in HTML with tracking
   */
  async wrapLinksWithTracking(
    emailId: number,
    html: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      term?: string;
    }
  ): Promise<{ html: string; trackingLinks: any[] }> {
    const links = this.extractLinks(html);
    const trackingLinks: any[] = [];
    let modifiedHtml = html;

    for (const originalUrl of links) {
      const trackingId = this.generateTrackingId();
      const trackedUrl = this.generateTrackedUrl(originalUrl, trackingId, utmParams);

      // The tracked URL goes through our redirect, but we store the final destination with UTM
      let finalUrl = originalUrl;
      try {
        const url = new URL(originalUrl);
        if (utmParams?.source) url.searchParams.set('utm_source', utmParams.source);
        if (utmParams?.medium) url.searchParams.set('utm_medium', utmParams.medium);
        if (utmParams?.campaign) url.searchParams.set('utm_campaign', utmParams.campaign);
        if (utmParams?.content) url.searchParams.set('utm_content', utmParams.content);
        if (utmParams?.term) url.searchParams.set('utm_term', utmParams.term);
        finalUrl = url.toString();
      } catch (e) {
        // Invalid URL, keep original
      }

      // Store tracking link in database
      try {
        await sql`
          INSERT INTO email_tracking_links (
            email_id,
            tracking_id,
            original_url,
            tracked_url,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            utm_term
          ) VALUES (
            ${emailId},
            ${trackingId},
            ${finalUrl},
            ${trackedUrl},
            ${utmParams?.source || null},
            ${utmParams?.medium || null},
            ${utmParams?.campaign || null},
            ${utmParams?.content || null},
            ${utmParams?.term || null}
          )
        `;

        trackingLinks.push({
          trackingId,
          originalUrl,
          trackedUrl
        });

        // Replace original URL with tracked URL in HTML
        // Use a more precise replacement to avoid partial matches
        const escapedOriginalUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const linkRegex = new RegExp(`href="${escapedOriginalUrl}"`, 'g');
        modifiedHtml = modifiedHtml.replace(linkRegex, `href="${trackedUrl}"`);
      } catch (error) {
        console.error('Error storing tracking link:', error);
      }
    }

    return { html: modifiedHtml, trackingLinks };
  }

  /**
   * Inject tracking pixel and wrap links in email HTML
   */
  async injectTracking(
    emailId: number,
    html: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      term?: string;
    }
  ): Promise<string> {
    // Generate tracking pixel
    const pixelTrackingId = this.generateTrackingId();
    
    // Update email with tracking pixel ID
    await sql`
      UPDATE emails 
      SET tracking_pixel_id = ${pixelTrackingId}
      WHERE id = ${emailId}
    `;

    const trackingPixel = this.generateTrackingPixel(emailId, pixelTrackingId);

    // Wrap links with tracking
    const { html: modifiedHtml } = await this.wrapLinksWithTracking(emailId, html, utmParams);

    // Inject tracking pixel before closing body tag
    let finalHtml = modifiedHtml;
    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `${trackingPixel}</body>`);
    } else {
      // If no body tag, append at the end
      finalHtml = `${finalHtml}${trackingPixel}`;
    }

    return finalHtml;
  }

  /**
   * Record email open event
   */
  async recordOpen(
    trackingId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      // Find email by tracking pixel ID
      const emails = await sql`
        SELECT id FROM emails WHERE tracking_pixel_id = ${trackingId}
      `;

      if (emails.length === 0) {
        return false;
      }

      const emailId = emails[0].id;

      // Record tracking event
      await sql`
        INSERT INTO email_tracking_events (
          email_id,
          event_type,
          tracking_id,
          user_agent,
          ip_address
        ) VALUES (
          ${emailId},
          'open',
          ${trackingId},
          ${userAgent || null},
          ${ipAddress || null}
        )
      `;

      // Update email open count and timestamps
      await sql`
        UPDATE emails
        SET 
          open_count = open_count + 1,
          first_opened_at = COALESCE(first_opened_at, NOW()),
          last_opened_at = NOW()
        WHERE id = ${emailId}
      `;

      return true;
    } catch (error) {
      console.error('Error recording email open:', error);
      return false;
    }
  }

  /**
   * Record link click event
   */
  async recordClick(
    trackingId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ originalUrl?: string; success: boolean }> {
    try {
      // Find tracking link
      const links = await sql`
        SELECT email_id, original_url 
        FROM email_tracking_links 
        WHERE tracking_id = ${trackingId}
      `;

      if (links.length === 0) {
        return { success: false };
      }

      const { email_id: emailId, original_url: originalUrl } = links[0];

      // Record tracking event
      await sql`
        INSERT INTO email_tracking_events (
          email_id,
          event_type,
          tracking_id,
          user_agent,
          ip_address,
          link_url
        ) VALUES (
          ${emailId},
          'click',
          ${trackingId},
          ${userAgent || null},
          ${ipAddress || null},
          ${originalUrl}
        )
      `;

      // Update tracking link click count and timestamps
      await sql`
        UPDATE email_tracking_links
        SET 
          click_count = click_count + 1,
          first_clicked_at = COALESCE(first_clicked_at, NOW()),
          last_clicked_at = NOW()
        WHERE tracking_id = ${trackingId}
      `;

      // Update email click count
      await sql`
        UPDATE emails
        SET click_count = click_count + 1
        WHERE id = ${emailId}
      `;

      return { originalUrl, success: true };
    } catch (error) {
      console.error('Error recording link click:', error);
      return { success: false };
    }
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(emailId: number): Promise<{
    email: any;
    opens: number;
    clicks: number;
    uniqueOpens: number;
    uniqueClicks: number;
    openRate: number;
    clickRate: number;
    replyCount: number;
    firstOpenedAt?: Date;
    lastOpenedAt?: Date;
    events: any[];
    links: any[];
  }> {
    // Get email details
    const emails = await sql`
      SELECT 
        id, subject, to_emails, sent_at, 
        open_count, click_count, reply_count,
        first_opened_at, last_opened_at
      FROM emails
      WHERE id = ${emailId}
    `;

    if (emails.length === 0) {
      throw new Error('Email not found');
    }

    const email = emails[0];

    // Get tracking events
    const events = await sql`
      SELECT 
        event_type, 
        occurred_at, 
        user_agent, 
        ip_address, 
        link_url
      FROM email_tracking_events
      WHERE email_id = ${emailId}
      ORDER BY occurred_at DESC
    `;

    // Get tracking links
    const links = await sql`
      SELECT 
        original_url,
        tracked_url,
        click_count,
        first_clicked_at,
        last_clicked_at,
        utm_source,
        utm_medium,
        utm_campaign
      FROM email_tracking_links
      WHERE email_id = ${emailId}
      ORDER BY click_count DESC
    `;

    // Calculate unique opens and clicks (count distinct IPs)
    const uniqueOpensResult = await sql`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM email_tracking_events
      WHERE email_id = ${emailId} AND event_type = 'open' AND ip_address IS NOT NULL
    `;

    const uniqueClicksResult = await sql`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM email_tracking_events
      WHERE email_id = ${emailId} AND event_type = 'click' AND ip_address IS NOT NULL
    `;

    const uniqueOpens = uniqueOpensResult[0]?.count || 0;
    const uniqueClicks = uniqueClicksResult[0]?.count || 0;

    // Calculate rates (percentage)
    const openRate = email.open_count > 0 ? 100 : 0;
    const clickRate = email.open_count > 0 ? (email.click_count / email.open_count) * 100 : 0;

    return {
      email,
      opens: email.open_count,
      clicks: email.click_count,
      uniqueOpens: Number(uniqueOpens),
      uniqueClicks: Number(uniqueClicks),
      openRate,
      clickRate,
      replyCount: email.reply_count,
      firstOpenedAt: email.first_opened_at,
      lastOpenedAt: email.last_opened_at,
      events,
      links
    };
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(filters: {
    userId?: number;
    contactId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    byContact: any[];
    byDate: any[];
    topPerformers: any[];
  }> {
    // Build WHERE conditions dynamically
    let whereConditions = ['e.is_sent = true'];
    
    if (filters.contactId) {
      whereConditions.push(`e.contact_id = ${filters.contactId}`);
    }

    if (filters.startDate) {
      whereConditions.push(`e.sent_at >= '${filters.startDate.toISOString()}'`);
    }

    if (filters.endDate) {
      whereConditions.push(`e.sent_at <= '${filters.endDate.toISOString()}'`);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Get overall stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sent,
        SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) as total_opened,
        SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END) as total_clicked,
        SUM(CASE WHEN reply_count > 0 THEN 1 ELSE 0 END) as total_replied
      FROM emails e
      ${whereClause}
    `;

    const statsResult: any = await sql.unsafe(statsQuery);
    const stats = Array.isArray(statsResult) ? statsResult : [];
    const totalSent = Number(stats[0]?.total_sent || 0);
    const totalOpened = Number(stats[0]?.total_opened || 0);
    const totalClicked = Number(stats[0]?.total_clicked || 0);
    const totalReplied = Number(stats[0]?.total_replied || 0);

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Get stats by contact
    const byContactQuery = `
      SELECT 
        e.contact_id,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(*) as emails_sent,
        SUM(CASE WHEN e.open_count > 0 THEN 1 ELSE 0 END) as emails_opened,
        SUM(CASE WHEN e.click_count > 0 THEN 1 ELSE 0 END) as emails_clicked,
        SUM(e.open_count) as total_opens,
        SUM(e.click_count) as total_clicks
      FROM emails e
      LEFT JOIN clients c ON c.id = e.contact_id
      ${whereClause}
      GROUP BY e.contact_id, c.first_name, c.last_name, c.email
      ORDER BY emails_opened DESC
      LIMIT 10
    `;

    const byContactResult: any = await sql.unsafe(byContactQuery);
    const byContact = Array.isArray(byContactResult) ? byContactResult : [];

    // Get stats by date
    const byDateQuery = `
      SELECT 
        DATE(sent_at) as date,
        COUNT(*) as emails_sent,
        SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) as emails_opened,
        SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END) as emails_clicked
      FROM emails e
      ${whereClause}
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const byDateResult: any = await sql.unsafe(byDateQuery);
    const byDate = Array.isArray(byDateResult) ? byDateResult : [];

    // Get top performing emails
    const topPerformersQuery = `
      SELECT 
        id,
        subject,
        to_emails,
        sent_at,
        open_count,
        click_count,
        reply_count
      FROM emails e
      ${whereClause}
      ORDER BY (open_count + click_count * 2 + reply_count * 3) DESC
      LIMIT 10
    `;

    const topPerformersResult: any = await sql.unsafe(topPerformersQuery);
    const topPerformers = Array.isArray(topPerformersResult) ? topPerformersResult : [];

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalReplied,
      openRate,
      clickRate,
      replyRate,
      byContact,
      byDate,
      topPerformers
    };
  }
}

export default EmailTrackingService;
