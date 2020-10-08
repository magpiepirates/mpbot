class session {
	constructor(obj) {
        if (!obj.hasOwnProperty('userID')) {
            console.error('session class requires userID');
            return false;
        }
        if (!obj.hasOwnProperty('id')) {
            console.error('session class requires id');
            return false;
        }
    }

	

}

module.exports = session;