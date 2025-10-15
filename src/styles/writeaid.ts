export function writeaidCssForDataUri(dataUri: string) {
  return `
    .writeaid-ribbon .wa-icon{ width:16px; height:16px; display:inline-block; background-repeat:no-repeat; background-size:16px 16px; background-image: url("${dataUri}"); color: var(--interactive-accent, var(--text-normal)); }
    .writeaid-ribbon{ padding-left:6px; }
  `;
}

export default writeaidCssForDataUri;
