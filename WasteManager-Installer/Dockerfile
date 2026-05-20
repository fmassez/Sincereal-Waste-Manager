# Waste Manager - Docker Image
# Usage: docker build -t wastemanager .
#        docker run -p 8080:80 wastemanager

FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier l'application buildée
COPY WasteManager-Portable/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
