/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as CoachRouteImport } from './routes/coach'
import { Route as LoginRouteImport } from './routes/login'
import { Route as RoutinesRouteImport } from './routes/routines'
import { Route as WeekRouteImport } from './routes/week'
import { Route as ApiAuthSplatRouteImport } from './routes/api/auth/$'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const CoachRoute = CoachRouteImport.update({
  id: '/coach',
  path: '/coach',
  getParentRoute: () => rootRouteImport,
} as any)
const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)
const RoutinesRoute = RoutinesRouteImport.update({
  id: '/routines',
  path: '/routines',
  getParentRoute: () => rootRouteImport,
} as any)
const WeekRoute = WeekRouteImport.update({
  id: '/week',
  path: '/week',
  getParentRoute: () => rootRouteImport,
} as any)
const ApiAuthSplatRoute = ApiAuthSplatRouteImport.update({
  id: '/api/auth/$',
  path: '/api/auth/$',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/coach': typeof CoachRoute
  '/login': typeof LoginRoute
  '/routines': typeof RoutinesRoute
  '/week': typeof WeekRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/coach': typeof CoachRoute
  '/login': typeof LoginRoute
  '/routines': typeof RoutinesRoute
  '/week': typeof WeekRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/coach': typeof CoachRoute
  '/login': typeof LoginRoute
  '/routines': typeof RoutinesRoute
  '/week': typeof WeekRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/coach' | '/login' | '/routines' | '/week' | '/api/auth/$'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/coach' | '/login' | '/routines' | '/week' | '/api/auth/$'
  id:
    | '__root__'
    | '/'
    | '/coach'
    | '/login'
    | '/routines'
    | '/week'
    | '/api/auth/$'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  CoachRoute: typeof CoachRoute
  LoginRoute: typeof LoginRoute
  RoutinesRoute: typeof RoutinesRoute
  WeekRoute: typeof WeekRoute
  ApiAuthSplatRoute: typeof ApiAuthSplatRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/coach': {
      id: '/coach'
      path: '/coach'
      fullPath: '/coach'
      preLoaderRoute: typeof CoachRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/routines': {
      id: '/routines'
      path: '/routines'
      fullPath: '/routines'
      preLoaderRoute: typeof RoutinesRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/week': {
      id: '/week'
      path: '/week'
      fullPath: '/week'
      preLoaderRoute: typeof WeekRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api/auth/$': {
      id: '/api/auth/$'
      path: '/api/auth/$'
      fullPath: '/api/auth/$'
      preLoaderRoute: typeof ApiAuthSplatRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  CoachRoute: CoachRoute,
  LoginRoute: LoginRoute,
  RoutinesRoute: RoutinesRoute,
  WeekRoute: WeekRoute,
  ApiAuthSplatRoute: ApiAuthSplatRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
