const chat = document.getElementById("chat");
const input = document.getElementById("query");
const button = document.getElementById("send");
const status = document.getElementById("status");
const inputContainer = document.getElementById("input-container");
const modelSelectorStack = document.getElementById("model-selector-stack");
const threadIdElement = document.getElementById("thread-id");
const imagePreview = document.getElementById("image-preview");
const imagePreviewThumb = document.getElementById("image-preview-thumb");
const imagePreviewName = document.getElementById("image-preview-name");
const removeImageButton = document.getElementById("remove-image");
const dropOverlay = document.getElementById("drop-overlay");
const apiEndpoints = ["http://localhost:8000"];

const models = [
  { displayName: "GPT-6 Luna", modelId: "openai/gpt-6-luna" },
  { displayName: "GPT-5.6 Luna", modelId: "openai/gpt-5.6-luna" },
  { displayName: "DeepSeek V4.1 Flash", modelId: "deepseek/deepseek-v4.1-flash" },
  { displayName: "MiniMax M3.1 Flash", modelId: "minimax/minimax-m3.1-flash" },
  { displayName: "GLM 5.3 Flash", modelId: "z-ai/glm-5.3-flash" },
  { displayName: "Qwen 3.5 Flash", modelId: "qwen/qwen3.5-flash-02-23" },
  { displayName: "Mistral Small 4", modelId: "mistralai/mistral-small-2603" },
  { displayName: "Claude Haiku 5.5", modelId: "anthropic/claude-haiku-5.5" }
];
let activeModelIndex = 0;
let modelId = models[activeModelIndex].modelId;
const threadId = globalThis.crypto?.randomUUID?.()
  ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let busy = false;
let attachedImage = null;
let attachedImageUrl = null;
let fileDragDepth = 0;
let dragStartY = null;
let dragPointerId = null;
let passedSnapThreshold = false;
let pageDragPointerId = null;
let pageDragStartX = 0;
let pageDragStartY = 0;
let pageDragX = 0;
let pageDragY = 0;
let activeTopPage = modelSelectorStack.querySelector(
  ".top-page:not(.top-page-next)"
);
const pageDismissDistance = 180;

threadIdElement.textContent = threadId;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInteger(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomToward(min, max, towardStart) {
  const amount = Math.pow(Math.random(), 1.35);
  return towardStart
    ? min + (max - min) * amount
    : max - (max - min) * amount;
}

function scatterBackgroundAssets() {
  const scatterGroup = document.querySelector("[aria-hidden='true']");
  const templates = [...scatterGroup.querySelectorAll(".scatter")];
  const assets = templates;
  const placements = [];
  const minimumDistance = Math.min(
    180,
    Math.max(100, Math.min(window.innerWidth, window.innerHeight) * 0.22)
  );
  const viewportPadding = 24;
  const centerExclusion = {
    left: window.innerWidth * 0.3,
    right: window.innerWidth * 0.7,
    top: window.innerHeight * 0.28,
    bottom: window.innerHeight * 0.72
  };
  const quadrants = [
    { left: 0, right: 0.5, top: 0, bottom: 0.5 },
    { left: 0.5, right: 1, top: 0, bottom: 0.5 },
    { left: 0, right: 0.5, top: 0.5, bottom: 1 },
    { left: 0.5, right: 1, top: 0.5, bottom: 1 }
  ];

  function candidateFor(quadrant, radius) {
    const xMin = viewportPadding + radius + window.innerWidth * quadrant.left;
    const xMax = window.innerWidth * quadrant.right - viewportPadding - radius;
    const yMin = viewportPadding + radius + window.innerHeight * quadrant.top;
    const yMax = window.innerHeight * quadrant.bottom - viewportPadding - radius;
    const edgeAxis = randomInteger(0, 2);
    const x = edgeAxis === 2
      ? randomBetween(xMin, xMax)
      : randomToward(xMin, xMax, quadrant.left === 0);
    const y = edgeAxis === 1
      ? randomBetween(yMin, yMax)
      : randomToward(yMin, yMax, quadrant.top === 0);
    const isOutsideCenter = (
      x + radius < centerExclusion.left ||
      x - radius > centerExclusion.right ||
      y + radius < centerExclusion.top ||
      y - radius > centerExclusion.bottom
    );
    const isFarEnough = placements.every(previous => {
      const distance = Math.hypot(x - previous.x, y - previous.y);
      return distance >= Math.max(minimumDistance, radius + previous.radius + 20);
    });

    return isOutsideCenter && isFarEnough ? { x, y, radius } : null;
  }

  assets.forEach((asset, index) => {
    const size = randomBetween(120, 180);
    const radius = Math.sqrt(2) * size / 2;
    let placement;
    const requiredQuadrant = index < quadrants.length
      ? quadrants[index]
      : quadrants[randomInteger(0, quadrants.length - 1)];

    for (let attempt = 0; attempt < 1000; attempt++) {
      placement = candidateFor(requiredQuadrant, radius);
      if (placement) {
        break;
      }
    }

    if (!placement) {
      placement = {
        x: randomBetween(
          viewportPadding + radius + window.innerWidth * requiredQuadrant.left,
          window.innerWidth * requiredQuadrant.right - viewportPadding - radius
        ),
        y: randomBetween(
          viewportPadding + radius + window.innerHeight * requiredQuadrant.top,
          window.innerHeight * requiredQuadrant.bottom - viewportPadding - radius
        ),
        radius
      };
    }

    placements.push(placement);
    asset.style.left = `${placement.x}px`;
    asset.style.top = `${placement.y}px`;
    asset.style.width = `${size}px`;
    asset.style.opacity = randomBetween(0.15, 0.35).toFixed(2);
    asset.style.transform = `translate(-50%, -50%) rotate(${randomBetween(-20, 20).toFixed(1)}deg)`;
  });
}

scatterBackgroundAssets();

function stripWrappingQuotes(text) {
  const trimmed = String(text).trim();
  const quotePairs = [["\"", "\""], ["'", "'"], ["“", "”"], ["‘", "’"]];
  for (const [opening, closing] of quotePairs) {
    if (trimmed.startsWith(opening) && trimmed.endsWith(closing) && trimmed.length >= 2) {
      return trimmed.slice(opening.length, -closing.length);
    }
  }
  return String(text);
}

function renderMarkdown(container, markdown) {
  const source = stripWrappingQuotes(markdown)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
  if (globalThis.marked && globalThis.DOMPurify) {
    container.innerHTML = DOMPurify.sanitize(marked.parse(source, { gfm: true }));
  } else {
    container.textContent = source;
  }
}

function addMessage(text, type) {
  if (type === "agent") {
    const row = document.createElement("div");
    row.className = "agent-row";

    const avatar = document.createElement("img");
    avatar.className = "agent-avatar";
    avatar.src = "assests/logo.png";
    avatar.alt = "Agent";

    const div = document.createElement("div");
    div.className = "message agent";
    const content = document.createElement("div");
    content.className = "markdown-content";
    renderMarkdown(content, text);
    div.appendChild(content);

    row.appendChild(avatar);
    row.appendChild(div);
    chat.appendChild(row);

    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  const div = document.createElement("div");
  div.className = `message ${type}`;
  const content = document.createElement("div");
  content.className = "markdown-content";
  renderMarkdown(content, text);
  div.appendChild(content);

  chat.appendChild(div);

  window.scrollTo(0, document.body.scrollHeight);
  return div;
}

function showUserMessage(text, image) {
  const div = addMessage(text, "user");
  if (image) {
    const imageElement = document.createElement("img");
    imageElement.className = "user-image";
    imageElement.src = URL.createObjectURL(image);
    imageElement.alt = image.name || "Attached image";
    div.prepend(imageElement);
  }
  return div;
}

function setAttachedImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    status.textContent = "Please drop an image file.";
    return;
  }
  if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
  attachedImage = file;
  attachedImageUrl = URL.createObjectURL(file);
  imagePreviewThumb.src = attachedImageUrl;
  imagePreviewName.textContent = file.name;
  imagePreview.hidden = false;
  status.textContent = "";
}

function clearAttachedImage() {
  if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
  attachedImage = null;
  attachedImageUrl = null;
  imagePreviewThumb.removeAttribute("src");
  imagePreview.hidden = true;
}

removeImageButton.addEventListener("click", clearAttachedImage);

window.addEventListener("dragenter", event => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  fileDragDepth++;
  dropOverlay.classList.add("is-visible");
});

window.addEventListener("dragover", event => {
  if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
});

window.addEventListener("dragleave", event => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  fileDragDepth = Math.max(0, fileDragDepth - 1);
  if (fileDragDepth === 0) dropOverlay.classList.remove("is-visible");
});

window.addEventListener("drop", event => {
  if (!event.dataTransfer?.files.length) return;
  event.preventDefault();
  fileDragDepth = 0;
  dropOverlay.classList.remove("is-visible");
  setAttachedImage(event.dataTransfer.files[0]);
});

function addAudioButton(message) {
  const audioButton = document.createElement("button");
  audioButton.className = "audio-button";
  audioButton.type = "button";
  audioButton.textContent = "Play response";
  audioButton.disabled = true;
  audioButton.setAttribute("aria-label", "Play response audio");
  message.appendChild(audioButton);

  let audioUrl = null;
  let audio = null;

  audioButton.addEventListener("click", () => {
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(err => {
        console.error("Audio playback failed:", err);
        audioButton.textContent = "Play response";
      });
    } else {
      audio.pause();
    }
  });

  return {
    setAudio(blob) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(blob);
      audio = new Audio(audioUrl);
      audio.controls = false;
      audio.preload = "auto";
      audio.volume = 1;
      audio.muted = false;
      audio.addEventListener("error", () => {
        console.error("The browser could not decode the response audio.");
        audioButton.textContent = "Audio unavailable";
        audioButton.disabled = true;
      });
      audio.addEventListener("play", () => {
        audioButton.textContent = "Pause response";
      });
      audio.addEventListener("pause", () => {
        audioButton.textContent = "Play response";
      });
      audio.addEventListener("ended", () => {
        audioButton.textContent = "Play response";
      });
      audio.load();
      audioButton.disabled = false;
    },
    setUnavailable() {
      audioButton.textContent = "Audio unavailable";
      audioButton.disabled = true;
    }
  };
}

async function send() {
  const query = input.value.trim();

  if ((!query && !attachedImage) || busy) return;

  const imageToSend = attachedImage;
  const displayedQuery = query || "What is in this image?";

  busy = true;

  document.body.classList.add("started");

  button.disabled = true;
  input.disabled = true;

  showUserMessage(displayedQuery, imageToSend);
  input.value = "";
  clearAttachedImage();

  const response = addMessage("Thinking...", "agent");
  const audio = addAudioButton(response);
  let appendedText = "";

  status.textContent = "PROCESSING";

  try {
    const imageData = imageToSend
      ? await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = () => reject(new Error("Could not read image"));
          reader.readAsDataURL(imageToSend);
        })
      : null;

    const endpoint = new URL(apiEndpoints[0]);
    const scheme = endpoint.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(
      `${scheme}//${endpoint.host}/croissant`
    );

    const responseText = await new Promise((resolve, reject) => {
      socket.onopen = () => {
        socket.send(JSON.stringify({
          query: displayedQuery,
          model_name: modelId,
          thread_id: threadId,
          image: imageData,
          image_media_type: imageToSend?.type ?? null
        }));
      };

      socket.onmessage = event => {
        const message = JSON.parse(event.data);

        if (message.type === "tool_update") {
          renderMarkdown(
            response.querySelector(".markdown-content"),
            `**${message.function}**: ${message.content}`
          );
        } else if (message.type === "text") {
          appendedText += `${appendedText ? "\n\n" : ""}${message.content}`;
          renderMarkdown(
            response.querySelector(".markdown-content"),
            appendedText
          );
        } else if (message.type === "component") {
          const componentPaths = {
            calculator: "components/calculator.html",
            plot2d: "components/plot2d.html",
            plot3d: "components/plot3d.html",
            periodic_table: "components/periodic-table.html"
          };
          const componentPath = componentPaths[message.name];
          if (componentPath) {
            const frame = document.createElement("iframe");
            frame.className = "component-frame";
            frame.title = ({
              calculator: "Calculator",
              plot2d: "2D equation plotter",
              plot3d: "3D surface plotter",
              periodic_table: "Periodic table"
            })[message.name];
            const componentUrl = new URL(componentPath, window.location.href);
            if ((message.name === "plot2d" || message.name === "plot3d") && typeof message.props?.equation === "string") {
              componentUrl.searchParams.set("equation", message.props.equation);
            }
            frame.src = componentUrl.href;
            frame.loading = "lazy";
            frame.setAttribute("sandbox", "allow-scripts");
            response.insertBefore(frame, response.querySelector(".audio-button"));
            response.classList.add("has-component");
          }
        } else if (message.type === "result") {
          appendedText += `${appendedText ? "\n\n" : ""}${message.content}`;
          renderMarkdown(
            response.querySelector(".markdown-content"),
            appendedText
          );
          resolve(message.content);
        } else if (message.type === "error") {
          reject(new Error(message.content));
        }
      };

      socket.onerror = () => reject(new Error("WebSocket connection failed"));
      socket.onclose = () => reject(new Error("WebSocket connection closed"));
    }).finally(() => socket.close());

    const speechText = responseText.trim() ? responseText : appendedText.trim();
    if (!speechText) {
      audio.setUnavailable();
    } else try {
      const speakParams = new URLSearchParams({
        text: speechText,
        language: "en-IN"
      });
      let audioResponse;
      let audioLastError;

      for (const endpoint of apiEndpoints) {
        try {
          const candidate = await fetch(
            `${endpoint}/speak?${speakParams.toString()}`,
            { method: "POST" }
          );

          if (!candidate.ok) {
            throw new Error(`HTTP ${candidate.status}`);
          }
          if (!candidate.headers.get("content-type")?.startsWith("audio/")) {
            throw new Error("Speech endpoint returned a non-audio response");
          }

          audioResponse = candidate;
          break;
        } catch (err) {
          audioLastError = err;
        }
      }

      if (!audioResponse) {
        throw audioLastError ?? new Error("All audio API endpoints failed");
      }

      const blob = await audioResponse.blob();
      console.log("TTS audio:", {
        type: blob.type,
        size: blob.size,
        contentLength: audioResponse.headers.get("content-length")
      });
      if (!blob.size) {
        throw new Error("Speech endpoint returned empty audio");
      }
      audio.setAudio(blob);
    } catch (audioError) {
      console.error("Could not generate response audio:", audioError);
      audio.setUnavailable();
    }

  } catch (err) {
    renderMarkdown(response.querySelector(".markdown-content"), `Error: ${err.message}`);

  } finally {
    busy = false;

    button.disabled = false;
    input.disabled = false;

    status.textContent = "";

    input.focus();

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }
}

function snapHandle(toBottom) {
  button.style.top = toBottom
    ? "var(--handle-bottom)"
    : "var(--handle-top)";
}

function setTopPageTransform(x, y, rotation) {
  activeTopPage.style.transform =
    `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
}

function handleTopPagePointerDown(event) {
  const page = event.target.closest(".top-page");
  if (
    !page ||
    page !== activeTopPage ||
    pageDragPointerId !== null ||
    page.classList.contains("is-ripped")
  ) {
    return;
  }

  activeTopPage = page;
  pageDragPointerId = event.pointerId;
  pageDragStartX = event.clientX;
  pageDragStartY = event.clientY;
  pageDragX = 0;
  pageDragY = 0;
  activeTopPage.classList.add("is-dragging");
  activeTopPage.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handleTopPagePointerMove(event) {
  if (pageDragPointerId !== event.pointerId) return;

  pageDragX = event.clientX - pageDragStartX;
  pageDragY = Math.max(0, event.clientY - pageDragStartY);
  if (Math.hypot(pageDragX, pageDragY) > 2) {
    modelSelectorStack.classList.add("has-next-page");
  }
  const rotation = pageDragX * 0.12 + pageDragY * 0.025;
  setTopPageTransform(pageDragX, pageDragY, rotation);
  if (Math.hypot(pageDragX, pageDragY) >= pageDismissDistance) {
    activeTopPage.classList.add("is-dismissed");
  }
  event.preventDefault();
}

function handleTopPagePointerUp(event) {
  if (pageDragPointerId !== event.pointerId) return;

  const dismissed = activeTopPage.classList.contains("is-dismissed");
  const movedEnough = pageDragY > 28 || Math.abs(pageDragX) > 28;
  const direction = pageDragX < 0 ? -1 : 1;
  activeTopPage.releasePointerCapture(event.pointerId);
  activeTopPage.classList.remove("is-dragging");
  pageDragPointerId = null;

  if (dismissed) {
    const finalX = direction * Math.max(145, Math.abs(pageDragX));
    const finalY = Math.max(145, pageDragY);
    setTopPageTransform(finalX, finalY, direction * 24);
    activeTopPage.classList.add("is-ripped");
    promoteReplacementPage();
    addReplacementPage();
  } else if (movedEnough) {
    const finalX = direction * Math.max(145, Math.abs(pageDragX));
    const finalY = Math.max(145, pageDragY);
    setTopPageTransform(finalX, finalY, direction * 24);
    activeTopPage.classList.add("is-ripped");
    promoteReplacementPage();
    addReplacementPage();
  } else {
    setTopPageTransform(0, 0, 0);
  }
}

function addReplacementPage() {
  const replacement = document.createElement("div");
  replacement.className = "top-page top-page-next";
  replacement.dataset.modelIndex = String(
    (activeModelIndex + 1) % models.length
  );
  const replacementImage = document.createElement("img");
  replacementImage.src = "assests/top_page.png";
  replacementImage.alt = "";
  const replacementLabel = document.createElement("span");
  replacementLabel.className = "top-page-label";
  replacementLabel.textContent =
    models[Number(replacement.dataset.modelIndex)].displayName;
  replacement.append(replacementImage, replacementLabel);
  modelSelectorStack.insertBefore(replacement, activeTopPage);
  modelSelectorStack.classList.add("has-next-page");
}

function promoteReplacementPage() {
  const replacement = modelSelectorStack.querySelector(".top-page-next");
  if (!replacement) return;

  activeModelIndex = Number(replacement.dataset.modelIndex);
  modelId = models[activeModelIndex].modelId;
  replacement.classList.remove("top-page-next");
  activeTopPage = replacement;
}

modelSelectorStack.addEventListener("pointerdown", handleTopPagePointerDown);
modelSelectorStack.addEventListener("pointermove", handleTopPagePointerMove);
modelSelectorStack.addEventListener("pointerup", handleTopPagePointerUp);
modelSelectorStack.addEventListener("pointercancel", handleTopPagePointerUp);

function handlePointerDown(event) {
  if (busy) return;

  dragStartY = event.clientY;
  dragPointerId = event.pointerId;
  passedSnapThreshold = false;
  button.classList.add("is-dragging");
  button.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (dragPointerId !== event.pointerId || dragStartY === null) return;

  const bounds = inputContainer.getBoundingClientRect();
  const handleHeight = button.getBoundingClientRect().height;
  const handleStyles = getComputedStyle(button);
  const topLimit = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-top")) / 100);
  const bottomLimit = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-bottom")) / 100);
  const halfHandle = handleHeight / 2;
  const handleCenter = event.clientY - bounds.top;
  const snapThreshold = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-snap-threshold")) / 100);
  const hasText = Boolean(input.value.trim() || attachedImage);

  if (hasText && (passedSnapThreshold || handleCenter >= snapThreshold)) {
    passedSnapThreshold = true;
    snapHandle(true);
    event.preventDefault();
    return;
  }

  const position = handleCenter - halfHandle;
  const maximumPosition = bottomLimit - halfHandle;
  const resistanceStart = topLimit + (maximumPosition - topLimit) * 0.72;
  const resistance = parseFloat(
    handleStyles.getPropertyValue("--handle-resistance")
  );
  const resistedPosition = position > resistanceStart
    ? resistanceStart + (position - resistanceStart) * resistance
    : position;
  const clampedPosition = Math.max(
    topLimit - halfHandle,
    Math.min(maximumPosition, resistedPosition)
  );

  button.style.top = `${(clampedPosition / bounds.height) * 100}%`;
  event.preventDefault();
}

function handlePointerUp(event) {
  if (dragPointerId !== event.pointerId || dragStartY === null) return;

  const bounds = inputContainer.getBoundingClientRect();
  const handleStyles = getComputedStyle(button);
  const snapThreshold = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-snap-threshold")) / 100);
  const releasedBelowThreshold = event.clientY - bounds.top >= snapThreshold;
  const shouldSnapToBottom = Boolean(input.value.trim() || attachedImage) &&
    (passedSnapThreshold || releasedBelowThreshold);
  button.releasePointerCapture(event.pointerId);
  button.classList.remove("is-dragging");
  dragStartY = null;
  dragPointerId = null;

  if (shouldSnapToBottom) {
    snapHandle(true);
    if (input.value.trim() || attachedImage) {
      send();
    }
  } else {
    snapHandle(false);
  }

  passedSnapThreshold = false;
}

button.addEventListener("pointerdown", handlePointerDown);
button.addEventListener("pointermove", handlePointerMove);
button.addEventListener("pointerup", handlePointerUp);
button.addEventListener("pointercancel", handlePointerUp);

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});
