const technologies = [
    "Django",
    "FastAPI",
    "Laravel",
    "PostgreSQL",
    "Docker"
    ];
    
    
    export const TechStack = () => {
    
    return (
    
    <div
    className="
    flex
    flex-wrap
    justify-center
    gap-3
    mt-8
    "
    >
    
    {
    technologies.map((tech)=>(
    <span
    key={tech}
    className="
    px-3
    py-1
    rounded-full
    bg-card
    border
    text-sm
    "
    >
    
    {tech}
    
    </span>
    ))
    }
    
    </div>
    
    )
    
    }