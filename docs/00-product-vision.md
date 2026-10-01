# 00 — Product vision

> Help Ethiopians build a professional digital identity, present their skills credibly, and become ready for local and global opportunities.

The portfolio website is the visible output. The real product is **career identity + credibility + opportunity readiness**.

## Core idea: one master profile

A user maintains **one structured profile** (experience, education, projects, skills, certificates, services…). Every output is generated from it:

```
                 Master profile
                       │
     ┌─────────────────┼──────────────────┐
     ▼                 ▼                  ▼
 Portfolio site       CV / Resume       Career Passport
 /u/<username>        ATS, academic,    one link + QR
                      job-specific PDFs
```

Change something once (e.g. add "Backend Developer at XYZ") and it updates the site and the CVs.

## Principles

| Principle | What it means for the code |
|-----------|----------------------------|
| **Evidence over claims** | No star ratings. Skills link to the projects, jobs and certificates that prove them. |
| **Structured, reusable data** | Store facts (dates, levels, links), not page-specific text, so the same data can render a website, a PDF or an API response. |
| **Profession-aware** | Section sets per profession (developer, architect, photographer, student, researcher…). |
| **Ethiopia-first** | English + Amharic content. Ethiopian education levels (TVET, Diploma, BSc/MSc). Students build a profile from education, projects and internships. |
| **Mobile-first, guided** | Form-like editor ("+ Add project"), not a CMS. A user should be able to publish in 10 minutes from a phone. |
| **Generous free tier** | Portfolio, subdomain, CV and PDF export, QR code free. Paid: custom domain, AI assistant, analytics, multiple CVs. |

## Roadmap

1. **Now:** the owner's own portfolio, built on the master-profile data model (see [05](05-master-profile.md))
2. Owner dashboard (mobile-first forms on `/api/me/`)
3. CV/PDF generation from the profile, plus a QR code
4. Templates and profession-specific sections, English/Amharic content
5. Public signup, subdomains, custom domains
6. Career assistant (AI guidance that only rewrites user-provided facts), analytics

## Not now

Job board, freelance marketplace, employer ATS, social network, course marketplace, 100 templates, mobile app, credential-verification infrastructure.

These are possible later. The first goal is one excellent loop: **sign up → guided profile → design → CV → publish → share**.
