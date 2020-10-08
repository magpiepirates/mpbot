const { google } = require('googleapis');

//https://developers.google.com/drive/api/v3/reference/files/get --reference

/**
* Creates a CollabDrive object, used to interact with the 'collabs' folder in the MP drive
*/
class CollabDrive {
    constructor() {
        this.collabFolderID = '1JW56wJB6oh4K4bufg3Z2ervlyOjC-pvN';

        this.drive = google.drive('v3');
        const auth = new google.auth.GoogleAuth({
            keyFile: 'creds/mongo.json',
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.appdata',
                'https://www.googleapis.com/auth/drive.file'
            ]
        });
        google.options({ auth: auth });
    }

    /**
     * Creates the trackList file, used for reference. Kinda obsolete, since we now store the metadata inside of the actual file
     * @param {String} collabName 
     * @param {*} data 
     */
    createTrackList(collabName, data) {
        if (typeof collabName !== 'string') throw new Error('collabName must be a string');

        let csvBody = `File Name, Artist, Track Name, Notes\n${data.fileName}, ${data.artistName}, ${data.trackName}, ${data.notes}\n`;
        return this.getCollabFolder(collabName)
            .then(res => {
                let folderId = res.data.files[0].id;
                return this.drive.files.create({
                    requestBody: {
                        'name': `${collabName}-tracklist.csv`,
                        'parents': [folderId]
                    },
                    media: {
                        mimeType: 'text/csv',
                        body: csvBody
                    }
                })
            });
    }

    /**
     * Appends data related to a file into the tracklist file in the collab folder. Kinda obsolete since we now store the metadata in the actual file
     * @param {String} collabName 
     * @param {*} data 
     */

    appendToTrackList(collabName, data) {
        let fileId;
        return this.drive.files.list({
            q: `name = '${collabName}-tracklist.csv' and mimeType = 'text/csv'`
        })
            .then((res) => {
                console.log(res);
                fileId = res.data.files[0].id;
                return this.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }, {
                    responseType: 'stream'
                })
                    .then(res => {
                        return new Promise((resolve, reject) => {
                            let chunks = [];
                            res.data
                                .on('end', function () {
                                    let prevContent = Buffer.concat(chunks).toString();
                                    let newContent = `${data.fileName}, ${data.artistName}, ${data.trackName}, ${data.notes}\n`;
                                    prevContent += newContent;
                                    resolve(prevContent);
                                })
                                .on('error', function (err) {
                                    reject(err);
                                })
                                .on('data', function (chunk) {
                                    chunks.push(chunk);
                                })
                        })
                    })
                    .then(csvBody => this.drive.files.update({
                        fileId: fileId,
                        media: {
                            mimeType: 'text/csv',
                            body: csvBody
                        }
                    }));
            })
    }

    /**
     * Uploads a file to the corresponding collab folder
     * @param {String} collabName 
     * @param {*} data 
     */
    uploadFile(collabName, data) {
        if (typeof collabName !== 'string') throw new Error('collabName must be a string');
        return this.getCollabFolder(collabName)
            .then(res => {
                let folderId = res.data.files[0].id;
                return this.drive.files.create({
                    media: {
                        body: data.body,
                        mimeType: data.mimeType
                    },
                    requestBody: {
                        'name': data.fileName,
                        'parents': [folderId]
                    }
                })
            })
    }

    /**
     * Creates a new folder in the 'collab' folder, named like the collab
     * @param {String} collabName 
     */
    createCollabFolder(collabName) {
        if (typeof collabName !== 'string') throw new Error('collabName must be a string');

        return this.drive.files.create({
            requestBody: {
                'name': collabName,
                'parents': [this.collabFolderID],
                'mimeType': 'application/vnd.google-apps.folder'
            }
        });
    }

    /**
     * Gets the contents of a collab folder
     * @param {String} collabName 
     * @returns a list of files inside of the collabName folder
     */
    getCollabFolder(collabName) {
        if (typeof collabName !== 'string') throw new Error('collabName must be a string');
        return this.drive.files.list({
            q: `name = '${collabName}' and mimeType = 'application/vnd.google-apps.folder' and '${this.collabFolderID}' in parents`
        });
    }

    /**
     * Deletes the collab folder
     * @param {String} collabName 
     */
    deleteCollabFolder(collabName) {
        if (typeof collabName !== 'string') throw new Error('collabName must be a string');
        let folderId;
        return this.getCollabFolder(collabName)
            .then(res => {
                let fileArray = res.data.files;
                if (fileArray.length <= 0) throw new Error(`Collab folder ${collabName} doesn't exist.`)
                folderId = fileArray[0].id;

                folderId = res.data.files[0].id;
                return this.drive.files.delete({ fileId: folderId });
            });
    }
}

module.exports = CollabDrive;