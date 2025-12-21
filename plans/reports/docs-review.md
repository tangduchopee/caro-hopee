You are a Principal Engineer and Performance Auditor.

I want you to perform a FULL-SYSTEM PERFORMANCE, STABILITY, and SCALABILITY AUDIT
for a production-level application.

Analyze the system holistically across:
- Frontend (React / Web)
- Backend (API / WebSocket)
- State management
- Network & I/O
- Memory lifecycle
- Security-related performance risks

====================
AUDIT REQUIREMENTS
====================

1. FRONTEND PERFORMANCE
- React rendering behavior (re-renders, memo usage, dependency correctness)
- useEffect / useLayoutEffect lifecycle correctness
- requestAnimationFrame, setTimeout, setInterval cleanup
- Memory leaks and state updates after unmount
- Event listener management
- Resize / scroll / animation performance
- Large state object mutation risks
- Virtualization, batching, throttling, debouncing
- Bundle size, dynamic imports, lazy loading impact
- Console logs or dev-only logic leaking into production

2. STATE MANAGEMENT
- Context / Redux / Zustand usage efficiency
- Over-rendering due to state coupling
- Selector memoization quality
- Smart merge / deep clone cost
- Immutable update correctness
- Potential race conditions or stale closures

3. BACKEND API PERFORMANCE
- API response time breakdown
- Database query efficiency (indexes, N+1, batch queries)
- Transaction scope correctness
- Memory usage per request
- Heavy synchronous logic on request path
- Error handling overhead
- Logging overhead (sync vs async)

4. DATABASE & STORAGE
- Query patterns under load
- Index coverage
- Write amplification
- Lock contention risks
- Connection pooling behavior
- Cold start vs warm performance

5. REALTIME / WEBSOCKET
- Event listener cleanup
- Broadcast fan-out cost
- Throttling / debouncing strategy
- Disconnect / reconnect behavior under load
- Memory retention after client disconnect
- Race conditions during reconnect

6. SECURITY & ABUSE-RELATED PERFORMANCE
- Rate limiting (API + socket)
- Abuse vectors (spam, DoS, brute force)
- Auth token refresh impact
- Session validation cost
- Input validation overhead

7. SCALABILITY & LOAD
- Expected bottlenecks at:
  - 100 users
  - 500 users
  - 1000+ users
- Horizontal vs vertical scaling readiness
- Stateless vs stateful constraints
- Cache usage effectiveness
- Cold start impact

8. PRODUCTION READINESS
- Missing production guards
- Unhandled edge cases
- Cleanup completeness
- Fail-safe behavior
- Graceful degradation under stress

====================
OUTPUT FORMAT
====================

Return a structured report with:

1. Overall Health Score (0–10)
2. CRITICAL issues (must-fix before deploy)
3. HIGH priority issues (edge cases / leaks)
4. MEDIUM priority issues (scale / security / maintainability)
5. LOW priority improvements
6. Positive observations
7. Estimated capacity limits (users, requests, sockets)
8. Clear FIX recommendations per issue
9. Explicit “Fix Before Production” checklist
10. Final verdict: Is the system PRODUCTION-READY or not?

IMPORTANT:
- Be brutally honest
- Assume real production traffic
- Do NOT sugarcoat
- Focus on performance, stability, and long-term scalability
