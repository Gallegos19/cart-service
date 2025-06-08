const extractUserInfo = (req, res, next) => {
  // Extraer información del usuario desde headers del API Gateway
  req.user = {
    id: req.headers['x-user-id'],
    email: req.headers['x-user-email'],
    role: req.headers['x-user-role']
  };
  
  // ID de request para tracking
  req.requestId = req.headers['x-request-id'];
  
  next();
};

module.exports = extractUserInfo;