import { Composition } from 'remotion'
import { ExtractMintExplainer } from './Explainer'

export function RemotionRoot() {
  return (
    <Composition
      id="ExtractMintExplainer"
      component={ExtractMintExplainer}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
    />
  )
}
