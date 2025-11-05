"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
// Apply authentication middleware to all routes in this router
router.use(authMiddleware_1.authMiddleware);
/**
 * Encrypt sensitive data (passwords, API keys, etc.)
 */
const encrypt = (text) => {
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-32-characters!';
    const key = crypto_1.default.scryptSync(secretKey, 'salt', 32);
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        encrypted,
        iv: iv.toString('hex')
    };
};
/**
 * Decrypt sensitive data
 */
const decrypt = (encryptedData) => {
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-32-characters!';
    const key = crypto_1.default.scryptSync(secretKey, 'salt', 32);
    const decipher = crypto_1.default.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
/**
 * GET /credentials
 * Get all credentials for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, clientId } = req.query;
        // Mock credentials data - replace with actual database query
        let credentials = [
            {
                id: 1,
                name: 'AWS Production',
                type: 'aws',
                description: 'Production AWS account credentials',
                username: 'admin@company.com',
                // In real implementation, passwords would be encrypted
                passwordEncrypted: encrypt('super-secret-password').encrypted,
                url: 'https://aws.amazon.com',
                apiKey: encrypt('AKIA1234567890EXAMPLE').encrypted,
                clientId: 1,
                userId: userId,
                createdAt: new Date('2024-10-15'),
                updatedAt: new Date('2024-10-15')
            },
            {
                id: 2,
                name: 'Database Admin',
                type: 'database',
                description: 'Production database credentials',
                username: 'db_admin',
                passwordEncrypted: encrypt('db-password-123').encrypted,
                url: 'postgresql://localhost:5432/production',
                apiKey: null,
                clientId: 2,
                userId: userId,
                createdAt: new Date('2024-10-20'),
                updatedAt: new Date('2024-10-20')
            },
            {
                id: 3,
                name: 'API Gateway',
                type: 'api',
                description: 'Third-party API gateway credentials',
                username: 'api_user',
                passwordEncrypted: null,
                url: 'https://api.example.com',
                apiKey: encrypt('sk_live_123456789abcdef').encrypted,
                clientId: 1,
                userId: userId,
                createdAt: new Date('2024-11-01'),
                updatedAt: new Date('2024-11-01')
            }
        ];
        // Apply filters if provided
        if (type) {
            credentials = credentials.filter(cred => cred.type === type);
        }
        if (clientId) {
            credentials = credentials.filter(cred => cred.clientId === parseInt(clientId));
        }
        // Remove sensitive data from response (don't send encrypted passwords/keys)
        const safeCredentials = credentials.map(cred => ({
            id: cred.id,
            name: cred.name,
            type: cred.type,
            description: cred.description,
            username: cred.username,
            url: cred.url,
            hasPassword: !!cred.passwordEncrypted,
            hasApiKey: !!cred.apiKey,
            clientId: cred.clientId,
            userId: cred.userId,
            createdAt: cred.createdAt,
            updatedAt: cred.updatedAt
        }));
        res.json({
            success: true,
            data: safeCredentials,
            message: 'Credentials retrieved successfully',
            filters: { type, clientId }
        });
    }
    catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve credentials'
        });
    }
});
/**
 * POST /credentials
 * Create new credentials for the authenticated user
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, type, description, username, password, url, apiKey, clientId } = req.body;
        // Validation
        if (!name || !type) {
            res.status(400).json({
                success: false,
                error: 'Name and type are required'
            });
            return;
        }
        // Validate type
        const validTypes = ['aws', 'database', 'api', 'ssh', 'ftp', 'email', 'social', 'other'];
        if (!validTypes.includes(type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid type. Must be one of: ' + validTypes.join(', ')
            });
            return;
        }
        // Encrypt sensitive data
        const passwordEncrypted = password ? encrypt(password).encrypted : null;
        const apiKeyEncrypted = apiKey ? encrypt(apiKey).encrypted : null;
        // Mock credential creation - replace with actual database insert
        const newCredential = {
            id: Math.floor(Math.random() * 1000) + 100, // Mock ID
            name,
            type,
            description: description || null,
            username: username || null,
            passwordEncrypted,
            url: url || null,
            apiKey: apiKeyEncrypted,
            clientId: clientId || null,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Return safe version (without encrypted data)
        const safeCredential = {
            id: newCredential.id,
            name: newCredential.name,
            type: newCredential.type,
            description: newCredential.description,
            username: newCredential.username,
            url: newCredential.url,
            hasPassword: !!newCredential.passwordEncrypted,
            hasApiKey: !!newCredential.apiKey,
            clientId: newCredential.clientId,
            userId: newCredential.userId,
            createdAt: newCredential.createdAt,
            updatedAt: newCredential.updatedAt
        };
        res.status(201).json({
            success: true,
            data: safeCredential,
            message: 'Credentials created successfully'
        });
    }
    catch (error) {
        console.error('Error creating credentials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create credentials'
        });
    }
});
/**
 * GET /credentials/:id
 * Get specific credentials by ID (must belong to authenticated user)
 * This endpoint can optionally decrypt password/apiKey for authorized users
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const credentialId = parseInt(req.params.id);
        const { decrypt: shouldDecrypt } = req.query;
        if (isNaN(credentialId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid credential ID'
            });
            return;
        }
        // Mock credential lookup - replace with actual database query
        const credential = {
            id: credentialId,
            name: 'Sample Credential',
            type: 'api',
            description: 'Sample API credentials',
            username: 'sample_user',
            passwordEncrypted: encrypt('sample-password').encrypted,
            url: 'https://api.sample.com',
            apiKey: encrypt('sk_sample_123456').encrypted,
            clientId: 1,
            userId: userId,
            createdAt: new Date('2024-11-01'),
            updatedAt: new Date('2024-11-01')
        };
        // Prepare response
        let responseData = {
            id: credential.id,
            name: credential.name,
            type: credential.type,
            description: credential.description,
            username: credential.username,
            url: credential.url,
            hasPassword: !!credential.passwordEncrypted,
            hasApiKey: !!credential.apiKey,
            clientId: credential.clientId,
            userId: credential.userId,
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt
        };
        // Optionally decrypt sensitive data if requested
        // NOTE: In production, add additional security checks here
        if (shouldDecrypt === 'true') {
            try {
                responseData.password = credential.passwordEncrypted ?
                    decrypt({ encrypted: credential.passwordEncrypted, iv: '' }) : null;
                responseData.apiKey = credential.apiKey ?
                    decrypt({ encrypted: credential.apiKey, iv: '' }) : null;
            }
            catch (decryptError) {
                console.error('Decryption error:', decryptError);
                // Don't expose decryption errors to client
            }
        }
        res.json({
            success: true,
            data: responseData,
            message: 'Credential retrieved successfully'
        });
    }
    catch (error) {
        console.error('Error fetching credential:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve credential'
        });
    }
});
/**
 * PUT /credentials/:id
 * Update specific credentials (must belong to authenticated user)
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const credentialId = parseInt(req.params.id);
        const { name, type, description, username, password, url, apiKey, clientId } = req.body;
        if (isNaN(credentialId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid credential ID'
            });
            return;
        }
        // Encrypt sensitive data if provided
        const passwordEncrypted = password ? encrypt(password).encrypted : null;
        const apiKeyEncrypted = apiKey ? encrypt(apiKey).encrypted : null;
        // Mock credential update - replace with actual database update
        const updatedCredential = {
            id: credentialId,
            name: name || 'Updated Credential',
            type: type || 'api',
            description: description || 'Updated description',
            username: username || 'updated_user',
            passwordEncrypted,
            url: url || 'https://updated.api.com',
            apiKey: apiKeyEncrypted,
            clientId: clientId || null,
            userId: userId,
            createdAt: new Date('2024-11-01'),
            updatedAt: new Date()
        };
        // Return safe version
        const safeCredential = {
            id: updatedCredential.id,
            name: updatedCredential.name,
            type: updatedCredential.type,
            description: updatedCredential.description,
            username: updatedCredential.username,
            url: updatedCredential.url,
            hasPassword: !!updatedCredential.passwordEncrypted,
            hasApiKey: !!updatedCredential.apiKey,
            clientId: updatedCredential.clientId,
            userId: updatedCredential.userId,
            createdAt: updatedCredential.createdAt,
            updatedAt: updatedCredential.updatedAt
        };
        res.json({
            success: true,
            data: safeCredential,
            message: 'Credential updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating credential:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update credential'
        });
    }
});
/**
 * DELETE /credentials/:id
 * Delete specific credentials (must belong to authenticated user)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const credentialId = parseInt(req.params.id);
        if (isNaN(credentialId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid credential ID'
            });
            return;
        }
        // Mock credential deletion - replace with actual database delete
        // In real implementation, ensure credential belongs to authenticated user
        res.json({
            success: true,
            message: 'Credential deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete credential'
        });
    }
});
exports.default = router;
//# sourceMappingURL=credentialRoutes.js.map