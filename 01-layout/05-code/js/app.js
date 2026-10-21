
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector("#navbar");
    const nav = navbar?.querySelector(".options");
    const themeColor = document.querySelector('meta[name="theme-color"]');

    if (!navbar || !nav) return;

    const links = [...nav.querySelectorAll(".nav-link")];

    const sections = links
        .map(link => {
            const href = link.getAttribute("href");

            return href?.startsWith("#")
                ? document.querySelector(href)
                : null;
        })
        .filter(Boolean);

    const TABLET_BREAKPOINT = 1100;
    const carousels = [];

    /* =====================================
       COLOR DEL NAVBAR Y CHROME
    ===================================== */

    function updateThemeColor() {
        if (!themeColor) return;

        themeColor.setAttribute(
            "content",
            navbar.classList.contains("scrolled")
                ? "#0c111e"
                : "#111827"
        );
    }

    /* =====================================
       INDICADOR ANIMADO DEL NAVBAR
    ===================================== */

    function moveIndicator(activeLink) {
        if (!activeLink) return;

        links.forEach(link => {
            const isActive = link === activeLink;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        nav.style.setProperty(
            "--indicator-left",
            `${activeLink.offsetLeft}px`
        );

        nav.style.setProperty(
            "--indicator-width",
            `${activeLink.offsetWidth}px`
        );
    }

    function updateNavbar() {
        navbar.classList.toggle("scrolled", window.scrollY > 40);
        updateThemeColor();

        if (!sections.length) return;

        const referencePoint =
            window.scrollY +
            navbar.getBoundingClientRect().height +
            window.innerHeight * 0.28;

        let currentSection = sections[0];

        sections.forEach(section => {
            const sectionTop =
                section.getBoundingClientRect().top + window.scrollY;

            if (sectionTop <= referencePoint) {
                currentSection = section;
            }
        });

        const atPageBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 8;

        if (atPageBottom) {
            currentSection = sections[sections.length - 1];
        }

        const activeLink = links.find(link =>
            link.getAttribute("href") === `#${currentSection.id}`
        );

        moveIndicator(activeLink || links[0]);
    }

    links.forEach(link => {
        link.addEventListener("click", () => {
            moveIndicator(link);
        });
    });

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (ticking) return;

        ticking = true;

        window.requestAnimationFrame(() => {
            updateNavbar();
            ticking = false;
        });
    }, { passive: true });

    /* =====================================
       CARRUSELES PARA TABLETS Y CELULARES
    ===================================== */

    function createCarousel(track, name) {
        if (!track || track.dataset.carouselReady === "true") return;

        track.dataset.carouselReady = "true";

        const shell = document.createElement("div");
        shell.className = "carousel-shell";
        shell.setAttribute("role", "region");
        shell.setAttribute("aria-label", name);

        track.parentNode.insertBefore(shell, track);
        shell.appendChild(track);

        const previousButton = document.createElement("button");
        previousButton.type = "button";
        previousButton.className = "carousel-arrow prev";
        previousButton.innerHTML = "&#8249;";
        previousButton.setAttribute("aria-label", `Anterior: ${name}`);

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "carousel-arrow next";
        nextButton.innerHTML = "&#8250;";
        nextButton.setAttribute("aria-label", `Siguiente: ${name}`);

        shell.insertBefore(previousButton, track);
        shell.appendChild(nextButton);

        let scrollFrame = false;

        function getMaxScroll() {
            return Math.max(0, track.scrollWidth - track.clientWidth);
        }

        function updateButtons() {
            const tabletOrMobile =
                window.innerWidth <= TABLET_BREAKPOINT;

            const maxScroll = getMaxScroll();
            const hasOverflow = maxScroll > 2;

            previousButton.disabled =
                !tabletOrMobile ||
                !hasOverflow ||
                track.scrollLeft <= 2;

            nextButton.disabled =
                !tabletOrMobile ||
                !hasOverflow ||
                track.scrollLeft >= maxScroll - 2;
        }

        /*
         * Avanza el ancho visible del carrusel.
         * El scroll-snap del CSS ajusta la posición
         * al comienzo de la tarjeta más cercana.
         */
        function moveCarousel(direction) {
            if (window.innerWidth > TABLET_BREAKPOINT) return;

            const maxScroll = getMaxScroll();

            if (maxScroll <= 2) {
                updateButtons();
                return;
            }

            const currentPosition = track.scrollLeft;
            const viewportWidth = track.clientWidth;

            let targetPosition =
                currentPosition + direction * viewportWidth;

            targetPosition = Math.max(
                0,
                Math.min(maxScroll, targetPosition)
            );

            // Evitar intentar desplazarse fuera de los límites.
            if (Math.abs(targetPosition - currentPosition) < 2) {
                updateButtons();
                return;
            }

            track.scrollTo({
                left: targetPosition,
                behavior: "smooth"
            });

            updateButtons();
        }

        previousButton.addEventListener("click", () => {
            moveCarousel(-1);
        });

        nextButton.addEventListener("click", () => {
            moveCarousel(1);
        });

        track.addEventListener("scroll", () => {
            if (scrollFrame) return;

            scrollFrame = true;

            window.requestAnimationFrame(() => {
                updateButtons();
                scrollFrame = false;
            });
        }, { passive: true });

        // También permite usar las flechas del teclado.
        track.setAttribute("tabindex", "0");

        track.addEventListener("keydown", event => {
            if (window.innerWidth > TABLET_BREAKPOINT) return;

            if (event.key === "ArrowRight") {
                event.preventDefault();
                moveCarousel(1);
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveCarousel(-1);
            }
        });

        window.addEventListener("resize", updateButtons);

        // Cambios de orientación y dimensiones del iPad.
        window.addEventListener("orientationchange", () => {
            window.setTimeout(updateButtons, 150);
        });

        // Recalcular también cuando cambie el tamaño del carrusel.
        if ("ResizeObserver" in window) {
            const observer = new ResizeObserver(() => {
                updateButtons();
            });

            observer.observe(track);
            shell._carouselObserver = observer;
        }

        carousels.push({ track, updateButtons });

        // Esperar a que el navegador calcule las dimensiones reales.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(updateButtons);
        });
    }

    createCarousel(
        document.querySelector("#competidores .cards-container"),
        "Carrusel de competidores"
    );

    createCarousel(
        document.querySelector("#sede .sede-container"),
        "Carrusel de sede y ubicación"
    );

    createCarousel(
        document.querySelector("#patrocinadores .sponsors-grid"),
        "Carrusel de patrocinadores"
    );


    function refreshLayout() {
        updateNavbar();

        carousels.forEach(carousel => {
            carousel.updateButtons();
        });
    }

    window.addEventListener("resize", refreshLayout);

    window.addEventListener("load", () => {
        refreshLayout();
    });

    updateNavbar();
});
