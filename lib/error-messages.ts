// User-friendly error messages with solution guidance
// Supports both Korean and English

type ErrorCode =
  | 'WALLET_NOT_INSTALLED'
  | 'WALLET_CONNECTION_FAILED'
  | 'WALLET_REJECTED'
  | 'NETWORK_ERROR'
  | 'AUTH_FAILED'
  | 'REQUEST_FAILED'
  | 'BOOKMARK_FAILED'
  | 'SUBMIT_FAILED'
  | 'LOAD_FAILED'
  | 'UNKNOWN'

interface ErrorMessage {
  title: string
  description: string
  solution?: string
}

const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  WALLET_NOT_INSTALLED: {
    title: '지갑이 설치되어 있지 않아요',
    description: 'MetaMask 또는 다른 Web3 지갑을 설치해주세요.',
    solution: 'metamask.io에서 브라우저 확장 프로그램을 설치하세요.',
  },
  WALLET_CONNECTION_FAILED: {
    title: '지갑 연결에 실패했어요',
    description: '연결 중 문제가 발생했습니다.',
    solution: '지갑이 잠금 해제되어 있는지 확인하고 다시 시도해주세요.',
  },
  WALLET_REJECTED: {
    title: '연결이 거부되었어요',
    description: '지갑에서 연결 요청을 거부했습니다.',
    solution: '연결을 원하시면 지갑에서 요청을 승인해주세요.',
  },
  NETWORK_ERROR: {
    title: '네트워크 오류가 발생했어요',
    description: '인터넷 연결을 확인해주세요.',
    solution: '잠시 후 다시 시도하거나 페이지를 새로고침해주세요.',
  },
  AUTH_FAILED: {
    title: '로그인에 실패했어요',
    description: '인증 중 문제가 발생했습니다.',
    solution: '다른 로그인 방법을 시도하거나 잠시 후 다시 시도해주세요.',
  },
  REQUEST_FAILED: {
    title: '요청을 처리하지 못했어요',
    description: '서버에서 요청을 처리하는 중 오류가 발생했습니다.',
    solution: '잠시 후 다시 시도해주세요.',
  },
  BOOKMARK_FAILED: {
    title: '북마크 처리에 실패했어요',
    description: '북마크를 저장하거나 삭제하는 중 오류가 발생했습니다.',
    solution: '로그인 상태를 확인하고 다시 시도해주세요.',
  },
  SUBMIT_FAILED: {
    title: '제출에 실패했어요',
    description: '데이터를 저장하는 중 오류가 발생했습니다.',
    solution: '입력 내용을 확인하고 다시 시도해주세요.',
  },
  LOAD_FAILED: {
    title: '데이터를 불러오지 못했어요',
    description: '콘텐츠를 로드하는 중 오류가 발생했습니다.',
    solution: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
  },
  UNKNOWN: {
    title: '문제가 발생했어요',
    description: '예상치 못한 오류가 발생했습니다.',
    solution: '페이지를 새로고침하거나 고객센터에 문의해주세요.',
  },
}

// Pattern matching for common error messages
const ERROR_PATTERNS: [RegExp, ErrorCode][] = [
  [/provider not (found|enabled|available)/i, 'WALLET_NOT_INSTALLED'],
  [/user (rejected|denied|cancelled)/i, 'WALLET_REJECTED'],
  [/connector not found/i, 'WALLET_NOT_INSTALLED'],
  [/(connection|connect) (failed|error)/i, 'WALLET_CONNECTION_FAILED'],
  [/network (error|failed|unavailable)/i, 'NETWORK_ERROR'],
  [/(auth|authentication|login) (failed|error)/i, 'AUTH_FAILED'],
  [/error\s*4\d{2}/i, 'REQUEST_FAILED'],
  [/error\s*5\d{2}/i, 'NETWORK_ERROR'],
  [/bookmark/i, 'BOOKMARK_FAILED'],
  [/fetch|load/i, 'LOAD_FAILED'],
]

export function getErrorCode(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message : String(error)

  for (const [pattern, code] of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return code
    }
  }

  return 'UNKNOWN'
}

export function getErrorMessage(error: unknown): ErrorMessage {
  const code = getErrorCode(error)
  return ERROR_MESSAGES[code]
}

export function formatErrorForToast(error: unknown): string {
  const { title, solution } = getErrorMessage(error)
  return solution ? `${title} ${solution}` : title
}

// For toast.error with description
export function getErrorForToast(error: unknown): { title: string; description: string } {
  const msg = getErrorMessage(error)
  return {
    title: msg.title,
    description: msg.solution || msg.description,
  }
}

export { ERROR_MESSAGES, type ErrorCode, type ErrorMessage }
