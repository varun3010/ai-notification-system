/**
 * Sample notifications used for seeding and for the auto-generator demo loop.
 */

module.exports = [
  {
    title: 'Unauthorized login attempt detected',
    message: 'A suspicious login from a new device was blocked. Verify your account immediately.',
    source: 'security-bot'
  },
  {
    title: 'Invoice #4521 is overdue',
    message: 'Your payment for the May subscription is overdue. Please update your card.',
    source: 'billing'
  },
  {
    title: 'Server CPU at 92%',
    message: 'API cluster us-east-1 is approaching capacity. Auto-scaling triggered.',
    source: 'monitoring'
  },
  {
    title: 'CONGRATULATIONS! You WON a free iPhone!!!',
    message: 'Click here to claim your prize now! Limited time offer, act now!',
    source: 'unknown'
  },
  {
    title: 'Weekly digest',
    message: 'Here are 5 articles you might enjoy this week. FYI only.',
    source: 'newsletter'
  },
  {
    title: 'Sarah commented on your PR',
    message: 'Sarah left a comment on pull request #214 — quick reply needed.',
    source: 'github'
  },
  {
    title: 'Scheduled maintenance tonight',
    message: 'Database maintenance scheduled for 11pm UTC. Expect 5 min downtime.',
    source: 'devops'
  },
  {
    title: '50% OFF flash sale!',
    message: 'Limited time discount, free shipping. Subscribe for more deals.',
    source: 'marketing'
  },
  {
    title: 'Production deployment failed',
    message: 'CRITICAL: deploy of api@v2.4.1 failed health checks. Rollback in progress!!',
    source: 'ci'
  },
  {
    title: 'Meeting reminder: design review',
    message: 'Design review starts in 30 minutes. Agenda attached.',
    source: 'calendar'
  }
];
