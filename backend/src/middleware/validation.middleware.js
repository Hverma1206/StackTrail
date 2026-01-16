const rateLimitStore = new Map();

//rate limit 5 done
// 15 req per 60sec

export const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore.has(identifier)) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitStore.get(identifier);

    if (now > record.resetTime) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxAttempts) {
      const timeLeft = Math.ceil((record.resetTime - now) / 1000 / 60);
      return res.status(429).json({
        error: `Too many attempts. Please try again in ${timeLeft} minutes.`,
      });
    }

    record.count++;
    return next();
  };
};

//sql proctec
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === "object") {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
};
//email validate
export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  next();
};

//pswrd validate
export const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long",
    });
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return res.status(400).json({
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    });
  }

  next();
};
