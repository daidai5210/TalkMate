class BusinessError(Exception):
    def __init__(self, code: int, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthError(BusinessError):
    def __init__(self, code: int, message: str):
        super().__init__(code=code, message=message, status_code=401)
