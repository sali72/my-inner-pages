# Nginx Configuration for Production

This configuration is designed to work with Cloudflare as a reverse proxy.

## Files

- `nginx.conf` - General nginx configuration (replaces `/etc/nginx/nginx.conf`)
- `innerpages.ir.conf` - Site-specific configuration for innerpages.ir

## Features

- **No SSL config needed** - Cloudflare handles SSL/TLS termination
- **Real IP restoration** - Gets actual client IP from Cloudflare headers
- **Rate limiting** - 10 req/s for API, 5 req/s for auth endpoints
- **Security headers** - XSS, clickjacking, and MIME sniffing protection
- **Optimized proxying** - Keepalive connections, proper buffering
- **Health check endpoint** - No rate limiting or logging overhead

## Installation

### Step 1: Stop your Docker containers (to free port 80)
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Step 2: Install nginx (if not already installed)
```bash
sudo apt update
sudo apt install nginx -y
```

### Step 3: Configure nginx

1. **Copy the general nginx config** (optional - only if you want to replace default):
   ```bash
   sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
   ```

2. **Copy your site config:**
   ```bash
   sudo cp nginx/innerpages.ir.conf /etc/nginx/sites-available/innerpages.ir
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/innerpages.ir /etc/nginx/sites-enabled/
   ```

4. **Remove default site** (to avoid conflicts):
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

5. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

6. **Start nginx:**
   ```bash
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

### Step 4: Restart Docker containers with new port configuration
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 5: Verify everything works
```bash
# Check nginx status
sudo systemctl status nginx

# Check containers are running
docker ps

# Test the site
curl http://localhost
curl http://localhost/health
```

## Cloudflare Settings

In your Cloudflare dashboard:

1. **SSL/TLS Mode**: Set to "Flexible" or "Full" (not "Full (strict)" unless you add SSL to nginx)
2. **Always Use HTTPS**: Enable (Cloudflare will handle HTTP to HTTPS redirect)
3. **Automatic HTTPS Rewrites**: Enable
4. **Minimum TLS Version**: TLS 1.2 or higher

## Security Notes

- Rate limits: API (10 req/s), Auth (5 req/s) - adjust as needed
- Docker containers now bind to 127.0.0.1 only (not accessible from outside)
- Frontend moved from port 80 to 8080 internally to avoid conflict with nginx
- Hide `/docs` and `/openapi.json` in production by commenting out those location blocks
- Real IP restoration ensures rate limiting works correctly behind Cloudflare
- All security headers are included (no CSP yet - add if needed)

## Monitoring

Check nginx logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Rate Limit Adjustments

To change rate limits, edit these lines in `app.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;  # API rate
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;  # Auth rate
```
