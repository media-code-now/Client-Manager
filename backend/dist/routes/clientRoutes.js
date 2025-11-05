"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Apply authentication middleware to all routes in this router
router.use(authMiddleware_1.authMiddleware);
/**
 * GET /clients
 * Get all clients for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        // req.user is guaranteed to exist because of authMiddleware
        const userId = req.user.id;
        // Mock client data - replace with actual database query
        const clients = [
            {
                id: 1,
                name: 'Acme Corporation',
                email: 'contact@acme.com',
                phone: '+1-555-0123',
                userId: userId,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            },
            {
                id: 2,
                name: 'Tech Solutions Ltd',
                email: 'info@techsolutions.com',
                phone: '+1-555-0456',
                userId: userId,
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date('2024-02-01')
            }
        ];
        res.json({
            success: true,
            data: clients,
            message: 'Clients retrieved successfully'
        });
    }
    catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve clients'
        });
    }
});
/**
 * POST /clients
 * Create a new client for the authenticated user
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone, address } = req.body;
        // Validation
        if (!name || !email) {
            res.status(400).json({
                success: false,
                error: 'Name and email are required'
            });
            return;
        }
        // Mock client creation - replace with actual database insert
        const newClient = {
            id: Math.floor(Math.random() * 1000) + 100, // Mock ID
            name,
            email,
            phone: phone || null,
            address: address || null,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Here you would typically save to database:
        // const savedClient = await ClientService.create(newClient);
        res.status(201).json({
            success: true,
            data: newClient,
            message: 'Client created successfully'
        });
    }
    catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create client'
        });
    }
});
/**
 * GET /clients/:id
 * Get a specific client by ID (must belong to authenticated user)
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const clientId = parseInt(req.params.id);
        if (isNaN(clientId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID'
            });
            return;
        }
        // Mock client lookup - replace with actual database query
        // In real implementation, ensure client belongs to authenticated user
        const client = {
            id: clientId,
            name: 'Sample Client',
            email: 'sample@client.com',
            phone: '+1-555-0789',
            userId: userId,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
        };
        res.json({
            success: true,
            data: client,
            message: 'Client retrieved successfully'
        });
    }
    catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve client'
        });
    }
});
/**
 * PUT /clients/:id
 * Update a specific client (must belong to authenticated user)
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const clientId = parseInt(req.params.id);
        const { name, email, phone, address } = req.body;
        if (isNaN(clientId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID'
            });
            return;
        }
        // Mock client update - replace with actual database update
        const updatedClient = {
            id: clientId,
            name: name || 'Updated Client',
            email: email || 'updated@client.com',
            phone: phone || null,
            address: address || null,
            userId: userId,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date()
        };
        res.json({
            success: true,
            data: updatedClient,
            message: 'Client updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update client'
        });
    }
});
/**
 * DELETE /clients/:id
 * Delete a specific client (must belong to authenticated user)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const clientId = parseInt(req.params.id);
        if (isNaN(clientId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID'
            });
            return;
        }
        // Mock client deletion - replace with actual database delete
        // In real implementation, ensure client belongs to authenticated user
        res.json({
            success: true,
            message: 'Client deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete client'
        });
    }
});
exports.default = router;
//# sourceMappingURL=clientRoutes.js.map