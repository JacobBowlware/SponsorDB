const config = {
    backendUrl: process.env.NODE_ENV === 'production' 
        ? 'https://sponsor-db-server-f6ca7971af31.herokuapp.com/api/'
        : 'http://localhost:3001/api/'
};

export default config; 