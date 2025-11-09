#!/usr/bin/env node

/**
 * Add dynamic export config to all API routes to prevent build-time prerendering
 */

const fs = require('fs');
const path = require('path');

// API routes that need dynamic config
const apiRoutes = [
  'src/app/api/clients/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/integrations/email/route.ts',
  'src/app/api/cron/sync-emails/route.ts',
  'src/app/api/integrations/email/test/route.ts',
  'src/app/api/integrations/email/send/route.ts',
  'src/app/api/tracking/pixel/[id]/route.ts',
  'src/app/api/integrations/email/oauth/initiate/route.ts',
  'src/app/api/tracking/click/[id]/route.ts',
  'src/app/api/emails/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/tasks/route.ts',
  'src/app/api/workflows/route.ts',
  'src/app/api/emails/[id]/route.ts',
  'src/app/api/workflows/[id]/route.ts',
  'src/app/api/emails/[id]/analytics/route.ts',
  'src/app/api/workflows/[id]/execute/route.ts',
  'src/app/api/clients/[id]/route.ts',
  'src/app/api/tasks/[id]/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/refresh/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/api/password-change/route.ts',
  'src/app/api/password-reset/route.ts',
  'src/app/api/password-reset/confirm/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/projects/[id]/route.ts',
  'src/app/api/invoices/route.ts',
  'src/app/api/invoices/[id]/route.ts',
  'src/app/api/calendar/route.ts',
  'src/app/api/calendar/events/[id]/route.ts',
];

const dynamicConfig = `
// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
`;

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('Adding dynamic config to API routes...\n');

apiRoutes.forEach(routePath => {
  const fullPath = path.join(process.cwd(), routePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipped: ${routePath} (file not found)`);
    skippedCount++;
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if already has dynamic config
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✓ Already configured: ${routePath}`);
      skippedCount++;
      return;
    }

    // Find the first import statement
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import or the first non-comment line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('import{')) {
        insertIndex = i + 1;
      } else if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        break;
      }
    }

    // Insert the config after imports
    lines.splice(insertIndex, 0, dynamicConfig);
    const newContent = lines.join('\n');
    
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Updated: ${routePath}`);
    updatedCount++;
  } catch (error) {
    console.error(`❌ Error updating ${routePath}:`, error.message);
    errorCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Summary:`);
console.log(`  ✅ Updated: ${updatedCount}`);
console.log(`  ⚠️  Skipped: ${skippedCount}`);
console.log(`  ❌ Errors: ${errorCount}`);
console.log('='.repeat(60));
