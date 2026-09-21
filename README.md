# Internship Management Platform

Team 17 internship project and A5 integration service. This folder is the repository root.

```text
Internship_Management/
├── web/          Next.js application, tests and local configuration
├── supabase/     SQL migrations and verification queries
├── docs/         Assignment guides, PRDs, evidence and planning prompts
├── .gitignore
└── README.md
```

Start with the [implementation guide](docs/IMPLEMENTATION_A5.md). Record live test results in the [A5 evidence report](docs/A5-Team17-Integration-Evidence.md). The [database design](docs/Data_and_Query_Design.md) describes the broader project.

## Local development

```powershell
cd web
npm ci
npm run dev
```

Configure `web/.env.local` using `web/.env.example`. Keep credentials private. Environment files, dependencies and build output are ignored by Git.

## Connect a new repository

The previous `origin` remote has been removed. Existing local commits remain.
Create an empty repository with your Git provider, then run from this folder:

```powershell
git remote add origin <new-repository-url>
git status
git add .
git commit -m "Organize project and add A5 integration"
git push -u origin HEAD
```

Review staged files before committing. These commands publish the existing history along with the new changes; they do not create a history-free repository.
