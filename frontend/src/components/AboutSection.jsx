import { Briefcase, Code, User } from "lucide-react";

import { portfolioAPI } from "@/services/portfolioAPI";
import { useEffect, useState } from "react";

export const AboutSection = () => {
  const [aboutme, setAboutme] = useState(null);

  useEffect(() => {

    const fetchAboutme = async () => {

      try {
        const response = await portfolioAPI.getAboutMe();
        // console.log(response.data);

        setAboutme(response.data);

      } catch(error) {
        console.log(error);
      }

    };

    fetchAboutme();

  }, []);

  if (!aboutme) {
    return (
      <section>
        Loading...
      </section>
    );
  }

  return (
    <section id="about" className="py-24 px-4 relative">
      {" "}
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          About <span className="text-primary"> Me</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">
              {aboutme.title}
            </h3>

            <p className="text-muted-foreground">
              {aboutme.description}
            </p>

            <p className="text-muted-foreground">
              {aboutme.description_2}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <a href="#contact" className="cosmic-button">
                {" "}
                Get In Touch
              </a>
            {aboutme.cv_file && (
              <a
                href={aboutme.cv_file}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors duration-300"
              >
                Download CV
              </a>
            )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {aboutme.services.map((service,item)  => (
            <div className="gradient-border p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-lg"> {service.title}</h4>
                  <p className="text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
            ))}
            {/* <div className="gradient-border p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-lg">UI/UX Design</h4>
                  <p className="text-muted-foreground">
                    Designing intuitive user interfaces and seamless user
                    experiences.
                  </p>
                </div>
              </div>
            </div>
            <div className="gradient-border p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>

                <div className="text-left">
                  <h4 className="font-semibold text-lg">Project Management</h4>
                  <p className="text-muted-foreground">
                    Leading projects from conception to completion with agile
                    methodologies.
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};
