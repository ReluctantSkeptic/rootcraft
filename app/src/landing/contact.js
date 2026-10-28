// Contact form: posts to the shared site-contact Worker, which emails admin@yuriystasyuk.com.
document.querySelectorAll("[data-contact]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".contact-status");
    const button = form.querySelector("button");
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch("https://site-contact.ystasyuk.workers.dev", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, site: location.href }) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error);
      form.reset();
      status.textContent = "Thanks. Your message is on its way.";
    } catch (err) {
      status.textContent = err.message || "Couldn't send. Email admin@yuriystasyuk.com directly.";
    } finally { button.disabled = false; }
  });
});
