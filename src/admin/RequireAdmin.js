

// TEMP: no auth gate — always allow admin routes
// TODO: restore token check before production
const RequireAdmin = ({ children }) => {
  return children;
};

export default RequireAdmin;
