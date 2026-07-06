import React, { useState, useEffect, useRef } from "react";
import galaxy0 from "../assets/images/galaxy_background_1779780757373.png";
import galaxy1 from "../assets/images/hd_vivid_galaxy_1779780978111.png";
import butterfly from "../assets/images/hologram_butterfly_1779775623164.png";
import planet from "../assets/images/hologram_planet_1779776225377.png";
import galaxy2 from "../assets/images/rainbow_galaxy_1779781352503.png";
import galaxy3 from "../assets/images/warm_galaxy_1779781369262.png";
import spaceDark from "../assets/images/user_splash_bg_1779993731939.png";

const video1 = "/videos/12656_Big_Bang_1080.webm";
const video2 = "/videos/129936-745943770.mp4";

interface Props {
  bgImageId?: string;
}

export const GalaxyBackground: React.FC<Props> = ({ bgImageId = "galaxy1" }) => {
  const isVideo = bgImageId.startsWith("video") || bgImageId === "big_bang" || bgImageId === "neon_tunnel";
  const [videoPlayFailed, setVideoPlayFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getImgSrc = () => {
    if (bgImageId === "galaxy0") return galaxy0;
    if (bgImageId === "galaxy2") return galaxy2;
    if (bgImageId === "galaxy3") return galaxy3;
    if (bgImageId === "spaceDark") return spaceDark;
    if (bgImageId === "butterfly") return butterfly;
    if (bgImageId === "planet") return planet;
    return galaxy1;
  };

  const getVideoSrc = () => {
    if (bgImageId === "video1" || bgImageId === "big_bang") return video1;
    if (bgImageId === "video2" || bgImageId === "neon_tunnel") return video2;
    return video1;
  };

  useEffect(() => {
    setVideoPlayFailed(false);
    setVideoReady(false);
    
    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      
      // Force reload if source changed
      video.load();

      const playVideo = async () => {
        try {
          video.muted = true;
          await video.play();
        } catch (err) {
          console.warn("Autoplay blocked or failed:", err);
          setVideoPlayFailed(true);
        }
      };
      
      playVideo();
    }
  }, [bgImageId, isVideo]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-transparent flex items-center justify-center">
      <style>{`
        @keyframes micro-jitter {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-0.5px, 0.5px); }
          50% { transform: translate(0.5px, -0.5px); }
          75% { transform: translate(-0.25px, -0.25px); }
        }
        .animate-jitter {
          animation: micro-jitter 0.15s infinite normal;
        }
      `}</style>
      
      {/* Background layer with forced hardware acceleration */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {isVideo && !videoPlayFailed ? (
          <video
            key={getVideoSrc()}
            ref={videoRef}
            src={getVideoSrc()}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            onCanPlay={() => {
              setVideoPlayFailed(false);
              setVideoReady(true);
            }}
            onError={(e) => {
              console.error("Video error:", e);
              setVideoPlayFailed(true);
            }}
          />
        ) : null}
        
        {/* Render image if not a video, if video failed, or while video is loading */}
        {(!isVideo || videoPlayFailed || !videoReady) && (
          <img
            src={getImgSrc()}
            alt="Galaxy Background"
            className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${videoReady && isVideo && !videoPlayFailed ? 'opacity-0' : 'opacity-100'}`}
            referrerPolicy="no-referrer"
            style={{ 
              transform: "translate3d(0, 0, 0)",
              willChange: "transform"
            }}
          />
        )}
      </div>

      {/* Holographic matrix micro-mesh & pixel-smoothing scanline grid */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none opacity-[0.11] ${videoPlayFailed ? 'mix-blend-overlay' : ''}`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(18, 16, 24, 0) 50%, rgba(0, 0, 0, 0.4) 50%),
            linear-gradient(90deg, rgba(56, 189, 248, 0.1), rgba(168, 85, 247, 0.06), rgba(56, 189, 248, 0.1))
          `,
          backgroundSize: "100% 2px, 3px 100%",
          transform: "translate3d(0, 0, 0)"
        }}
      ></div>

      {/* Subtle pulsing glow in the center */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.1)_0%,transparent_70%)] transition-opacity duration-1000"
        style={{ animation: 'pulse 6s ease-in-out infinite' }}
      ></div>

      {/* Gradients to dim edges and blend into the dark UI - MUCH LIGHTER NOW */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,#000000_130%)] opacity-40 z-10"></div>
    </div>
  );
};

