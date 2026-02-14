# Antigravity Skills Usage Guide

This project uses `antigravity-awesome-skills` to enhance the capabilities of the Antigravity agent.

## Install Location
Skills are installed in the universal directory:
`~/.agent/skills`

Antigravity automatically scans this directory on startup.

## How to Add/Update Skills

### Update Existing Skills
To pull the latest skills from the repository:
```bash
npx antigravity-awesome-skills
```
Alternatively, if you prefer manual Git commands:
```bash
git -C ~/.agent/skills pull
```

### Add Custom Skills
1. Create a new folder in `~/.agent/skills/skills/`.
2. Add a `SKILL.md` file following the standard format.
3. Restart Antigravity (or your AI assistant) to reload the skills.

## How to Invoke Skills

To invoke a skill in your prompt, use the following syntax:

**`[Skill: SkillName]`**

### Examples
- `[Skill: supabase-automation] help me create a new Edge Function.`
- `[Skill: kaizen] review my current codebase for best practices.`

> [!TIP]
> You can also find a full list of available skills in `~/.agent/skills/CATALOG.md`.
