import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import { createRelayScene } from './relay-scene';
import RelayLoading from './RelayLoading.svelte';
vi.mock('./relay-scene', () => ({ createRelayScene: vi.fn() }));

let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
let scene: { draw: ReturnType<typeof vi.fn>; resize: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };
let resizeDisconnect: ReturnType<typeof vi.fn>;
let intersectionDisconnect: ReturnType<typeof vi.fn>;
beforeEach(() => {
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  scene = { draw: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
  vi.mocked(createRelayScene).mockReturnValue(scene);
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  resizeDisconnect = vi.fn(); intersectionDisconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); disconnect = resizeDisconnect; });
  vi.stubGlobal('IntersectionObserver', class { observe = vi.fn(); disconnect = intersectionDisconnect; });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('relay loading animation', () => {
  it('announces actual loading stages without fabricated progress', async () => {
    const { component, getByRole, container } = render(RelayLoading);
    expect(getByRole('status').textContent).toContain('Reading relay information');
    expect(getByRole('status').closest('[aria-busy="true"]')).toBeNull();
    await component.$set({ stage: 'config' });
    await waitFor(() => expect(getByRole('status').textContent).toContain('Finding your relay page'));
    await component.$set({ stage: 'content' });
    await waitFor(() => expect(getByRole('status').textContent).toContain('Bringing it all together'));
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector('canvas')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
  it('renders static artwork and schedules no motion when reduced motion is requested', () => {
    media.matches = true;
    const { getByTestId } = render(RelayLoading);
    expect(scene.draw).toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(getByTestId('relay-loading').dataset.motion).toBe('still');
  });
  it('responds to a live change in the motion preference', async () => {
    const { getByTestId } = render(RelayLoading);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    media.matches = true;
    media.addEventListener.mock.calls[0][1]();
    await waitFor(() => expect(getByTestId('relay-loading').dataset.motion).toBe('still'));
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
  it('retains the vector fallback when a GPU context cannot be created', () => {
    vi.mocked(createRelayScene).mockReturnValue(null);
    const { getByTestId, getByRole } = render(RelayLoading);
    expect(getByTestId('relay-loading').dataset.renderer).toBe('fallback');
    expect(getByRole('status')).toBeTruthy();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
  it('does not let graphics initialization failure break loading', () => {
    vi.mocked(createRelayScene).mockImplementation(() => { throw new Error('GPU denied'); });
    const { getByTestId } = render(RelayLoading);
    expect(getByTestId('relay-loading').dataset.renderer).toBe('fallback');
  });
  it('releases graphics and observers when removed', () => {
    const { unmount } = render(RelayLoading);
    unmount();
    expect(scene.dispose).toHaveBeenCalledTimes(1);
    expect(resizeDisconnect).toHaveBeenCalledOnce();
    expect(intersectionDisconnect).toHaveBeenCalledOnce();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
  it('switches to the static fallback after context loss and disposes once', async () => {
    const { container, getByTestId, unmount } = render(RelayLoading);
    container.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    await waitFor(() => expect(getByTestId('relay-loading').dataset.renderer).toBe('fallback'));
    expect(scene.dispose).toHaveBeenCalledOnce();
    unmount();
    expect(scene.dispose).toHaveBeenCalledOnce();
  });
});
