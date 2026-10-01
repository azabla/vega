// A code-editor style card describing the developer, built from profile data
const Line = ({ n, children }) => (
  <div className="flex gap-4">
    <span className="w-4 shrink-0 select-none text-right text-muted-foreground/50">{n}</span>
    <span className="min-w-0">{children}</span>
  </div>
);

const Str = ({ children }) => <span className="text-emerald-600 dark:text-emerald-300">"{children}"</span>;
const Key = ({ children }) => <span className="text-sky-700 dark:text-sky-300">{children}</span>;

export const ProfileCard = ({ profile, skills }) => (
  <div className="surface overflow-hidden shadow-[0_24px_60px_-24px_oklch(0_0_0/25%)]">
    <div className="flex items-center gap-2 border-b bg-secondary/50 px-4 py-3">
      <span className="size-3 rounded-full bg-red-400/80" />
      <span className="size-3 rounded-full bg-amber-400/80" />
      <span className="size-3 rounded-full bg-emerald-400/80" />
      <span className="ml-3 font-mono text-xs text-muted-foreground">profile.ts</span>
    </div>
    <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7">
      <Line n={1}>
        <span className="text-violet-600 dark:text-violet-300">const</span> developer = {"{"}
      </Line>
      <Line n={2}>
        &nbsp;&nbsp;<Key>name</Key>: <Str>{profile.name}</Str>,
      </Line>
      <Line n={3}>
        &nbsp;&nbsp;<Key>role</Key>: <Str>{profile.title}</Str>,
      </Line>
      {profile.location && (
        <Line n={4}>
          &nbsp;&nbsp;<Key>based</Key>: <Str>{profile.location}</Str>,
        </Line>
      )}
      <Line n={5}>
        &nbsp;&nbsp;<Key>stack</Key>: [
      </Line>
      {skills.map((skill, i) => (
        <Line key={skill.id} n={6 + i}>
          &nbsp;&nbsp;&nbsp;&nbsp;<Str>{skill.name}</Str>,
        </Line>
      ))}
      <Line n={6 + skills.length}>&nbsp;&nbsp;],</Line>
      <Line n={7 + skills.length}>{"}"};</Line>
    </pre>
  </div>
);
