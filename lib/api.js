const got = require('got');

const rootURI = 'https://www.googleapis.com';
const refreshTokenURI = 'https://accounts.google.com/o/oauth2/token';
const uploadExistingURI = id => `${rootURI}/upload/chromewebstore/v1.1/items/${id}`;
const publishURI = (id, target) => (
    `${rootURI}/chromewebstore/v1.1/items/${id}/publish?publishTarget=${target}`
);

class APIClient {
    constructor({ extensionId, clientId, clientSecret, refreshToken }) {
        this.extensionId = extensionId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
    }

    uploadExisting(readStream) {
        if (!readStream) {
            return Promise.reject(new Error('Read stream missing'));
        }

        const { extensionId } = this;

        return this.fetchToken().then(token => {
            return got.put(uploadExistingURI(extensionId), {
                headers: this._headers(token),
                body: readStream,
                json: true
            }).then(this._extractBody);
        });
    }

    publish(target = 'default') {
        const { extensionId } = this;

        return this.fetchToken().then(token => {
            return got.post(publishURI(extensionId, target), {
                headers: this._headers(token),
                json: true
            }).then(this._extractBody);
        });
    }

    fetchToken() {
        const { clientId, clientSecret, refreshToken } = this;

        return got.post(refreshTokenURI, {
            body: {
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
            },
            json: true
        }).then(this._extractBody).then(({ access_token }) => access_token);
    }

    _headers(token) {
        return {
            Authorization: `Bearer ${token}`,
            'x-goog-api-version': '2'
        };
    }

    _extractBody({ body }) {
        return body;
    }
}


module.exports = function(...args) {
    return new APIClient(...args);
};