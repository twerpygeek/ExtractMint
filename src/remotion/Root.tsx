import { Composition } from 'remotion'
import { ExtractMintExplainer } from './Explainer'
import { ExtractMintOnboarding } from './Onboarding'

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="ExtractMintExplainer"
        component={ExtractMintExplainer}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ExtractMintOnboarding"
        component={ExtractMintOnboarding}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  )
}
