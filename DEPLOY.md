# GPA Study Hub - Deployment Guide

## Architecture (Same as NITH, IITs, top colleges)

```
College Server Room              Internet              Students
┌────────────────────┐          │         ┌─────────────────┐
│ College PC         │          │         │ Any Phone       │
│ Express + SQLite   │◄─tunnel──┼─────────│ Download App    │
│ Cloudflare Tunnel  │  (free)  │         │ Sign Up → Use   │
└────────────────────┘          │         └─────────────────┘
```

**Cost: ZERO** | **Students: 2000+** | **Database: On college PC only**

---

## Quick Setup (5 minutes)

### On College PC:

1. **Install Node.js** from https://nodejs.org (LTS version)

2. **Install Cloudflare Tunnel** from:
   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   - Windows: Download `cloudflared-windows-amd64.exe`
   - Rename to `cloudflared.exe`
   - Put it in the project folder or add to PATH

3. **Double-click `start-server.bat`**
   - It installs dependencies
   - Starts Cloudflare Tunnel (shows a public URL)
   - Starts the server

4. **Copy the tunnel URL** (like `https://xyz.trycloudflare.com`)
   - Share this URL with all students
   - Put it in the app settings

### On Student's Phone:

1. Open the app
2. Go to Settings → paste the tunnel URL
3. Sign Up → Use the app

---

## How It Works

- **College PC** runs the server (Express) and database (SQLite)
- **Cloudflare Tunnel** creates a secure HTTPS tunnel from college PC to internet
- **Students** access via the tunnel URL from any network (college WiFi, home, mobile data)
- **Database** stays on college PC only — no cloud DB cost

## Why SQLite Handles 2000 Students

- Docker uses SQLite for millions of containers
- SQLite handles 50,000+ concurrent reads
- WAL mode allows simultaneous reads + writes
- For 2000 students, peak concurrent is ~200-300
- SQLite handles this easily on any modern PC

## Backup

The database is a single file: `server/gpa_hub.db`
- Copy this file daily to a USB drive
- Or set up automatic backup to Google Drive

## Troubleshooting

**Tunnel not starting?**
- Make sure `cloudflared.exe` is in the project folder or PATH
- Try: `cloudflared tunnel --url http://localhost:3000`

**Students can't connect?**
- Check if server is running (visit http://localhost:3000/api/health)
- Check if tunnel is running (look for the URL in the terminal)
- Try a different browser/device

**Server slow?**
- Check `http://localhost:3000/api/metrics` for response times
- Restart server if needed
- Check college PC RAM (minimum 4GB recommended)
