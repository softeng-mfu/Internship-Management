Act as a senior software architect.

Design an architecture for this platform.

Here are the requirements:

- Students can browse internship opportunities
- Students can view placement details
- Students can submit applications
- Students can view their own application history and statuses
- Advisors can review and approve or reject applications
- Students can submit internship progress updates
- The system must publish internship status changes to downstream university systems
- The system should support AI-assisted skill-to-placement matching, with fallback tag-based filtering

Here is the data model:

- Placement
- Application
- Approval
- ProgressUpdate
- Minimal user profile / identity reference for student and advisor roles

Constraints:

- University student project
- 3-5 developers
- One semester
- Budget = 0 THB
- Must deploy using free-tier services
- Keep architecture simple
- Do not introduce microservices unless clearly necessary

Consider these deployment options:

1. Vercel + Supabase
2. Cloudflare Workers + D1
3. Firebase

For each option explain:

- Frontend
- Backend/API
- Database
- Authentication
- Storage
- Deployment
- Advantages
- Disadvantages
- Major risks

Finally recommend ONE architecture
and explain why it is appropriate.

Prefer simplicity over theoretical scalability.
