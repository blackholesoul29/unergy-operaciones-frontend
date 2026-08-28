import { describe, expect, it } from 'vitest'
import { UserRole } from '~/types/user'
import { mobileHome, mobileRedirect, MOBILE_ROUTES } from './access'

describe('mobileHome', () => {
  it('sends coordinador and técnico to their own tray', () => {
    expect(mobileHome(UserRole.COORDINADOR)).toBe(MOBILE_ROUTES.coordinador)
    expect(mobileHome(UserRole.TECNICO)).toBe(MOBILE_ROUTES.tecnico)
  })

  it('sends everyone else, including no role at all, to solar', () => {
    expect(mobileHome(UserRole.ADMIN)).toBe(MOBILE_ROUTES.solar)
    expect(mobileHome(undefined)).toBe(MOBILE_ROUTES.solar)
  })
})

describe('mobileRedirect', () => {
  it('sends an unauthenticated visitor to the mobile login', () => {
    expect(mobileRedirect(MOBILE_ROUTES.solar, { isAuthenticated: false, role: undefined })).toBe(
      MOBILE_ROUTES.login,
    )
  })

  it('lets an unauthenticated visitor stay on the login itself', () => {
    expect(
      mobileRedirect(MOBILE_ROUTES.login, { isAuthenticated: false, role: undefined }),
    ).toBeNull()
  })

  it('sends an authenticated visitor away from the login, to their tray', () => {
    expect(
      mobileRedirect(MOBILE_ROUTES.login, { isAuthenticated: true, role: UserRole.TECNICO }),
    ).toBe(MOBILE_ROUTES.tecnico)
  })

  it('redirects coordinador and técnico away from the generic tray', () => {
    expect(
      mobileRedirect(MOBILE_ROUTES.solar, { isAuthenticated: true, role: UserRole.COORDINADOR }),
    ).toBe(MOBILE_ROUTES.coordinador)
    expect(
      mobileRedirect(MOBILE_ROUTES.solar, { isAuthenticated: true, role: UserRole.TECNICO }),
    ).toBe(MOBILE_ROUTES.tecnico)
  })

  it('keeps everyone else out of coordinador and técnico trays', () => {
    expect(
      mobileRedirect(MOBILE_ROUTES.coordinador, {
        isAuthenticated: true,
        role: UserRole.OPERACIONES,
      }),
    ).toBe(MOBILE_ROUTES.solar)
    expect(
      mobileRedirect(MOBILE_ROUTES.tecnico, { isAuthenticated: true, role: UserRole.COORDINADOR }),
    ).toBe(MOBILE_ROUTES.solar)
  })

  it('lets admin into the coordinador tray', () => {
    expect(
      mobileRedirect(MOBILE_ROUTES.coordinador, { isAuthenticated: true, role: UserRole.ADMIN }),
    ).toBeNull()
  })

  it('leaves an authenticated visitor on a tray that is already theirs', () => {
    expect(
      mobileRedirect(MOBILE_ROUTES.solar, { isAuthenticated: true, role: UserRole.OPERACIONES }),
    ).toBeNull()
    expect(
      mobileRedirect(MOBILE_ROUTES.tecnico, { isAuthenticated: true, role: UserRole.TECNICO }),
    ).toBeNull()
  })
})
