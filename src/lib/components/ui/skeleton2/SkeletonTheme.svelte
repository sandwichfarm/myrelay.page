<script lang="ts">
  import createEmotion from "@emotion/css/create-instance";

  const { css } = createEmotion({ key: "some-key" });

  const defaultBaseColor = "#eee";
  const defaultHighlightColor = "#f5f5f5";
  
  export let color: string = defaultBaseColor;
  export let highlightColor: string = defaultHighlightColor;

  const themeStyles = css`
    background-color: ${color};
    background-image: linear-gradient(
      90deg,
      ${color},
      ${highlightColor},
      ${color}
    );
  `;
</script>

<div class="{themeStyles} {$$props.class}">
  <slot />
</div>