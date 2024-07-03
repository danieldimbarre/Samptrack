FROM node:15

ARG TINI_VER="v0.19.0"

# install tini
ADD https://github.com/krallin/tini/releases/download/$TINI_VER/tini /sbin/tini
RUN chmod +x /sbin/tini

# install sqlite3
RUN apt-get update                                                   \
 && apt-get install    --quiet --yes --no-install-recommends sqlite3

# copy samptrack files
WORKDIR /usr/src/samptrack
COPY . .

# build samptrack
RUN npm install --build-from-source \
 && npm run build

# run as non root
RUN addgroup --gid 10043 --system samptrack \
 && adduser  --uid 10042 --system --ingroup samptrack --no-create-home --gecos "" samptrack \
 && chown -R samptrack:samptrack /usr/src/samptrack
USER samptrack

EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--", "node", "main.js"]
