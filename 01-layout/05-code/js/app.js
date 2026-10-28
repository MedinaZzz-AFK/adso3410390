document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector("#navbar");
    const nav = navbar?.querySelector(".options");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const burger = document.getElementById('burger');

    if (!navbar || !nav) return;

    if (burger) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    const links = [...nav.querySelectorAll(".nav-link")];

    links.forEach(link => {
        link.addEventListener("click", () => {
            moveIndicator(link);
            if (burger && nav) {
                burger.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    });

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

    function updateThemeColor() {
        if (!themeColor) return;

        themeColor.setAttribute(
            "content",
            navbar.classList.contains("scrolled")
                ? "#0c111e"
                : "#111827"
        );
    }

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

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (ticking) return;

        ticking = true;

        window.requestAnimationFrame(() => {
            updateNavbar();
            ticking = false;
        });
    }, { passive: true });

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

        window.addEventListener("orientationchange", () => {
            window.setTimeout(updateButtons, 150);
        });

        if ("ResizeObserver" in window) {
            const observer = new ResizeObserver(() => {
                updateButtons();
            });

            observer.observe(track);
            shell._carouselObserver = observer;
        }

        carousels.push({ track, updateButtons });

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