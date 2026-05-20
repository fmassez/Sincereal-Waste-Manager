# Dockerfile pour Sincereal Waste Manager
# Build : docker build -t sincereal-waste-manager .
# Run   : docker run -d -p 8080:80 --name sincereal sincereal-waste-manager

FROM nginx:alpine

# Copier les fichiers de l'application
COPY dist/ /usr/share/nginx/html/

# Copier la configuration nginx
COPY packages/nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
