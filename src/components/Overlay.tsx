import { useControlsState } from '../hooks/useControls'
import type { Controls } from '../hooks/useControls'
import './Overlay.css'

function Overlay() {
  const { setControls } = useControlsState()

  const handlePointerDown = (direction: keyof Controls) => {
    setControls((prev) => ({ ...prev, [direction]: true }))
  }

  const handlePointerUp = (direction: keyof Controls) => {
    setControls((prev) => ({ ...prev, [direction]: false }))
  }

  return (
    <div className="overlay">
      <div className="controls-info">
        <p>WASD / ??????? / ???????? ??????</p>
      </div>
      <div className="control-buttons">
        <div className="button-row">
          <button
            className="control-button forward"
            onPointerDown={() => handlePointerDown('forward')}
            onPointerUp={() => handlePointerUp('forward')}
            onPointerLeave={() => handlePointerUp('forward')}
            onTouchStart={(e) => {
              e.preventDefault()
              handlePointerDown('forward')
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handlePointerUp('forward')
            }}
          >
            ?
          </button>
        </div>
        <div className="button-row">
          <button
            className="control-button left"
            onPointerDown={() => handlePointerDown('left')}
            onPointerUp={() => handlePointerUp('left')}
            onPointerLeave={() => handlePointerUp('left')}
            onTouchStart={(e) => {
              e.preventDefault()
              handlePointerDown('left')
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handlePointerUp('left')
            }}
          >
            ?
          </button>
          <button
            className="control-button backward"
            onPointerDown={() => handlePointerDown('backward')}
            onPointerUp={() => handlePointerUp('backward')}
            onPointerLeave={() => handlePointerUp('backward')}
            onTouchStart={(e) => {
              e.preventDefault()
              handlePointerDown('backward')
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handlePointerUp('backward')
            }}
          >
            ?
          </button>
          <button
            className="control-button right"
            onPointerDown={() => handlePointerDown('right')}
            onPointerUp={() => handlePointerUp('right')}
            onPointerLeave={() => handlePointerUp('right')}
            onTouchStart={(e) => {
              e.preventDefault()
              handlePointerDown('right')
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handlePointerUp('right')
            }}
          >
            ?
          </button>
        </div>
      </div>
    </div>
  )
}

export default Overlay
