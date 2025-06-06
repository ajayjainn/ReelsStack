import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./composition";
import { ReelStackVideo } from "./reel-stack-video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Empty"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="ReelStackVideo"
        component={ReelStackVideo as React.ComponentType}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={720}
        height={1280}
        defaultProps={{
          videoId: "",
          title: "Sample Video",
          description: "This is a sample description",
          imageUrls: [],
          audioUrl: "",
          captions: [],
          script: "",
          voice: ""
        }}
      />
    </>
  );
};