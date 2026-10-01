import { Skeleton } from "@/components/ui/skeleton";


export const HeroSkeleton = () => {

    return (
        <section
            className="
            relative
            min-h-screen
            flex
            items-center
            justify-center
            px-4
            "
        >

            <div className="
                container
                max-w-4xl
                mx-auto
                text-center
                space-y-8
            ">


                {/* small badge */}

                <Skeleton
                    className="
                    h-8
                    w-40
                    mx-auto
                    rounded-full
                    "
                />


                {/* Name */}

                <div className="space-y-4">

                    <Skeleton
                        className="
                        h-14
                        md:h-20
                        w-3/4
                        mx-auto
                        "
                    />

                    <Skeleton
                        className="
                        h-14
                        md:h-20
                        w-1/2
                        mx-auto
                        "
                    />

                </div>


                {/* Description */}

                <div className="space-y-3">

                    <Skeleton
                        className="
                        h-5
                        w-full
                        max-w-2xl
                        mx-auto
                        "
                    />

                    <Skeleton
                        className="
                        h-5
                        w-4/5
                        mx-auto
                        "
                    />

                </div>


                {/* Button */}

                <Skeleton
                    className="
                    h-12
                    w-36
                    mx-auto
                    rounded-full
                    "
                />


            </div>


        </section>
    );
};