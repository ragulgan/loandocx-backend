export const appConst = {
    HEADER: {
      CONTENT_TYPE: 'application/json'
    },
    ERROR: {
      CLIENT_ERROR: {
        SUCCESS_REQUEST: 200,
        SUCCESS_SAVED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        ALREADY_EXIST: 409,
        SESSION_EXPIRED: 440
      },
      SERVER_ERROR: {
        INTERNAL_SERVER_ERROR: 500
      },
      CODE: 500,
      MSG: 'error'
    },
    SUCCESS: {
      CODE: 200,
      MSG: 'ok'
    }
  };