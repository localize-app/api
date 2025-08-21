export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN', // Platform-wide access
  TRANSLATOR = 'TRANSLATOR', // Translation-only access

  // client based
  COMPANY_OWNER = 'COMPANY_OWNER', // Company owner (client)
  MEMBER = 'MEMBER', // Regular user
}
