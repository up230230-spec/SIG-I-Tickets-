const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/forumController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/roles');

router.use(protect);

router.get('/', ctrl.listPosts);
router.post('/', requirePermission(PERMISSIONS.FORUM_POST), ctrl.createPost);
router.get('/:id', ctrl.getPost);
router.post('/:id/replies', requirePermission(PERMISSIONS.FORUM_POST), ctrl.addReply);
router.patch('/:id/moderate', requirePermission(PERMISSIONS.FORUM_MODERATE), ctrl.moderatePost);
router.delete('/:id', requirePermission(PERMISSIONS.FORUM_MODERATE), ctrl.deletePost);

module.exports = router;
