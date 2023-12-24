<p align="center">
	<img width="120" height="120" src="assets/images/logo.svg">
</p>

# Samptrack
This is a fork from Minetrack. [Check it out](https://minetrack.me).

### Features
- 🚀 Real time SAMP server player count tracking with customizable update speed.
- 📝 Historical player count logging with 24 hour peak and player count record tracking.
- 📈 Historical graph with customizable time frame.
- 📦 Out of the box included dashboard with various customizable sorting and viewing options.
- 📱(Decent) mobile support.

### Community Showcase
You can find a list of community hosted instances below. Want to be listed here? Add yourself in a pull request!

* https://samp.danieldimbarre.pl

## Installation
1. Node 12.4.0+ is required (you can check your version using `node -v`)
2. Make sure everything is correct in ```config.json```.
3. Add/remove servers by editing the ```servers.json``` file
4. Run ```npm install```
5. Run ```npm run build``` (this bundles `assets/` into `dist/`)
6. Run ```node main.js``` to boot the system (may need sudo!)

(There's also ```install.sh``` and ```start.sh```, but they may not work for your OS.)

Database logging is disabled by default. You can enable it in ```config.json``` by setting ```logToDatabase``` to true.
This requires sqlite3 drivers to be installed.

### Build and deploy with docker-compose
```
# build and start service
docker-compose up --build

# stop service and remove artifacts
docker-compose down
```

## Nginx reverse proxy
The following configuration enables Nginx to act as reverse proxy for a samptrack instance that is available at port 8080 on localhost:
```
server {
    server_name samp.danieldimbarre.pl;
    listen 80;
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```
