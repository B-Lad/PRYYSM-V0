# Pre-Launch Testing & Debugging Checklist

## 1. Performance Testing
- [ ] Load testing (simulate expected user count)
- [ ] Stress testing (beyond expected capacity)
- [ ] Spike testing (sudden traffic increases)
- [ ] Endurance testing (sustained load over time)
- [ ] API response time benchmarks (<200ms for critical paths)
- [ ] Database query optimization (no N+1 queries)
- [ ] Asset optimization (minified JS/CSS, compressed images)
- [ ] CDN configuration and caching headers
- [ ] Frontend bundle size analysis
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s

## 2. Security Testing
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection (Content Security Policy headers)
- [ ] CSRF protection
- [ ] Authentication & authorization checks
- [ ] Password hashing (bcrypt/argon2)
- [ ] JWT token security (expiry, refresh mechanism)
- [ ] Sensitive data exposure (no secrets in client code)
- [ ] HTTPS enforcement (SSL/TLS)
- [ ] CORS configuration
- [ ] Rate limiting on APIs
- [ ] Dependency vulnerability scanning (npm audit, safety)
- [ ] Security headers (HSTS, X-Frame-Options, etc.)

## 3. Error Handling & Logging
- [ ] Global error boundary implemented
- [ ] Client-side error logging (Sentry/logRocket)
- [ ] Server-side error logging structured
- [ ] Proper HTTP status codes returned
- [ ] User-friendly error messages (no stack traces in production)
- [ ] Retry logic for failed API calls
- [ ] Offline handling and graceful degradation
- [ ] Network timeout configurations
- [ ] Log rotation and retention policies
- [ ] Sensitive data filtering from logs

## 4. Data Integrity & Database
- [ ] Database migrations tested
- [ ] Seed data validation
- [ ] Index optimization for query patterns
- [ ] Connection pooling configured
- [ ] Database backup strategy tested
- [ ] Data validation on all CRUD operations
- [ ] Foreign key constraints
- [ ] Transaction handling for critical operations
- [ ] Database replication/failover (if applicable)
- [ ] Query performance analysis (EXPLAIN plans)

## 5. Integration Testing
- [ ] API contract testing (all endpoints)
- [ ] Third-party service integrations tested
- [ ] Payment gateway (if applicable) in production mode
- [ ] Email/SMS service delivery
- [ ] File upload/download functionality
- [ ] Webhook endpoints secured and tested
- [ ] Cache invalidation strategies
- [ ] Message queue processing (if used)
- [ ] WebSocket/real-time connections
- [ ] Cross-origin resource sharing

## 6. User Acceptance Testing (UAT)
- [ ] Critical user journeys verified (end-to-end)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness (iOS, Android)
- [ ] Form validation and submission
- [ ] Search functionality with edge cases
- [ ] Print/export functionality
- [ ] Notification system
- [ ] User role/permission matrix tested
- [ ] Session management and timeout

## 7. Monitoring & Observability
- [ ] Application Performance Monitoring (APM) configured
- [ ] Error tracking setup (Sentry, Rollbar)
- [ ] Log aggregation (ELK, Datadog, etc.)
- [ ] Metrics collection (Prometheus, Grafana)
- [ ] Health check endpoints (`/health`, `/ready`)
- [ ] Uptime monitoring (pingdom, uptimeRobot)
- [ ] API response time dashboards
- [ ] Database performance metrics
- [ ] Server resource monitoring (CPU, RAM, Disk)
- [ ] Alert thresholds configured
- [ ] Notification channels (Slack, PagerDuty)

## 8. Backup & Recovery
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Database point-in-time recovery capability
- [ ] Backup encryption
- [ ] Backup retention policy
- [ ] Off-site backup storage
- [ ] Recovery Time Objective (RTO) met
- [ ] Recovery Point Objective (RPO) met

## 9. CI/CD Pipeline
- [ ] Automated test suite passing
- [ ] Linting and code quality checks
- [ ] Security scanning in pipeline
- [ ] Staging environment mirrors production
- [ ] Deployment rollback strategy
- [ ] Zero-downtime deployment capability
- [ ] Environment variables management
- [ ] Secrets management (vault, AWS Secrets Manager)
- [ ] Post-deployment verification steps
- [ ] Database migration automation

## 10. Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Runbook for common issues
- [ ] Architecture diagram
- [ ] Data flow diagrams
- [ ] Incident response procedure
- [ ] User documentation/help guides
- [ ] Admin documentation
- [ ] System dependencies listed
- [ ] Contact information for escalation

## 11. Scalability & Architecture
- [ ] Horizontal scaling capability tested
- [ ] Load balancer configuration
- [ ] Auto-scaling rules (if cloud)
- [ ] Database connection limits reviewed
- [ ] Queue depth monitoring (if using queues)
- [ ] Cache eviction policies (Redis/Memcached)
- [ ] Static asset serving strategy
- [ ] Microservice communication (if applicable)
- [ ] Service discovery (if applicable)
- [ ] Circuit breaker patterns implemented

## 12. Network & Infrastructure
- [ ] DNS configuration verified
- [ ] SSL certificates valid and auto-renewing
- [ ] Firewall rules reviewed (minimal access)
- [ ] VPN/private network setup (if applicable)
- [ ] Content Delivery Network (CDN) configured
- [ ] DDoS protection enabled
- [ ] Geographic distribution (if global)
- [ ] Domain registrar and hosting accounts accessible
- [ ] Domain expiration dates noted
- [ ] IP whitelisting for admin panels

## 13. Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent mechanism (GDPR/CCPA)
- [ ] Data retention policies defined
- [ ] Right to deletion process
- [ ] Audit logs for sensitive operations
- [ ] Industry-specific compliance (HIPAA, PCI-DSS, etc.)
- [ ] Data processing agreements (DPA) with vendors
- [ ] Copyright and licensing compliance

## 14. Browser Console & Network
- [ ] No console errors in production build
- [ ] No 404s for static assets
- [ ] API calls returning correct status codes
- [ ] Network waterfall optimized (no blocking resources)
- [ ] Service worker registration (if PWA)
- [ ] Web Vitals within acceptable ranges
- [ ] Memory leaks checked (Chrome DevTools Performance)
- [ ] JavaScript bundle chunks analyzed
- [ ] Source maps generated for production (for debugging)

## 15. Pre-Launch Final Checks
- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Cache cleared/ warmed
- [ ] SSL certificate installed and trusted
- [ ] Domain DNS propagated
- [ ] Email deliverability tested (SPF, DKIM, DMARC)
- [ ] Social media preview images (OG tags)
- [ ] Favicon and app icons
- [ ] robots.txt configured
- [ ] sitemap.xml generated
- [ ] Google Analytics/Tracking verified
- [ ] Hotjar/analytics scripts tested
- [ ] Customer support channels ready
- [ ] Rollback plan tested and documented

---

## Quick Debugging Commands

### Frontend
```bash
# Check for console errors
npm run build && npx serve dist -p 3000

# Analyze bundle size
npx source-map-explorer 'build/static/js/*.js'

# Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

### Backend
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Test API endpoints
curl -i https://api.example.com/health

# Profile API responses
ab -n 1000 -c 10 https://api.example.com/endpoint

# Check for memory leaks
py-spy top --pid <process_id>
```

### Infrastructure
```bash
# SSL certificate expiry
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates

# DNS propagation
dig @8.8.8.8 example.com

# Check open ports
nmap -sT example.com
```

---

## Common Pre-Launch Issues

1. **CORS errors**: Verify server headers allow production domain
2. **Mixed content**: Ensure all resources load over HTTPS
3. **API rate limits**: Confirm third-party API quotas sufficient
4. **Database connections**: Pool size adequate for traffic
5. **Email deliverability**: SPF/DKIM/DMARC records configured
6. **Session storage**: Redis/cluster configured for multi-instance
7. **Static assets**: Cache headers set correctly (immutable for hashed files)
8. **Error tracking**: Sentry DSN points to production project
9. **Feature flags**: All flags set correctly for production
10. **Monitoring alerts**: Test alerts actually fire

---

## Emergency Rollback Procedure

1. Keep last stable commit tagged: `git tag -a stable-YYYYMMDD -m "pre-launch stable"`
2. Database migration rollback scripts ready
3. Load balancer can route traffic to previous version
4. Feature flags can disable new functionality instantly
5. Contact list for emergency communications ready

---

*Execute checklist systematically. Document findings. Fix issues before proceeding to next phase.*
