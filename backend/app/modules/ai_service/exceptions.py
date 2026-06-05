class AIServiceError(Exception):
    """AI 服务基础异常。"""


class AITimeoutError(AIServiceError):
    """调用超时。"""


class AIRateLimitError(AIServiceError):
    """限流。"""


class AIUnavailableError(AIServiceError):
    """服务不可用(网络/鉴权/余额等)。"""
