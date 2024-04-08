<script>
  import createEmotion from "@emotion/css/create-instance";
  const { css, keyframes } = createEmotion({ key: "some-key" });

  let customClassName = "";
  let Wrapper = null;
  export let count = 1;
  export let duration = 1.2;
  export let width = null;
  export { Wrapper as wrapper };
  export let height = null;
  export let circle = false;
  export { customClassName as class };

  export const defaultBaseColor = "#eee";

  export const defaultHighlightColor = "#f5f5f5";

  export const skeletonKeyframes = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

  export const skeletonStyles = css`
    background-color: ${defaultBaseColor};
    background-image: linear-gradient(
      90deg,
      ${defaultBaseColor},
      ${defaultHighlightColor},
      ${defaultBaseColor}
    );
    background-size: 200px 100%;
    background-repeat: no-repeat;
    border-radius: 4px;
    display: inline-block;
    line-height: 1;
    width: 100%;
    animation: ${skeletonKeyframes} ${duration}s ease-in-out infinite;
  `;

  const elements = [];

  for (let i = 0; i < count; i++) {
    let style = {};

    if (width !== null) {
      style.width = `${width}px`;
    }

    if (height !== null) {
      style.height = `${height}px`;
    }

    if (width !== null && height !== null && circle) {
      style.borderRadius = "50%";
    }

    let className = "svelte-loader-skeleton";
    if (customClassName) {
      className += " " + customClassName;
      console.log(className);
    }
    elements.push({
      className: className,
      defaultStyles: skeletonStyles,
      style,
    });
  }
</script>

{#if Wrapper}
  {#each elements as element}
    <span>
      <svelte:component this={Wrapper}>
        <span
          class="{`element.className`} {element.defaultStyles}"
          style="width:{element.style.width}; border-radius:{element.style
            .borderRadius}; height:{element.style.height}"
        >
          &zwnj;
        </span>
      </svelte:component>
    </span>
  {/each}
{:else}
  {#each elements as element}
    <span
      class="{element.className} {element.defaultStyles}"
      style="width:{element.style.width}; border-radius:{element.style
        .borderRadius}; height:{element.style.height}"
    >
      &zwnj;
    </span>
  {/each}
{/if}

<style>
</style>
