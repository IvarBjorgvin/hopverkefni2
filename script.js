document.addEventListener('DOMContentLoaded', () => {
    const isInSubfolder = window.location.pathname.includes('/sidur/');
    const basePath = isInSubfolder ? '../' : '';

    fetch(`${basePath}data/index.json`)
        .then(response => response.json())
        .then(data => {
            window.appData = data;

            // Update page title and header
            document.querySelector('h1').textContent = data.title;

            const nav = document.querySelector('nav');
            nav.innerHTML = '';

            // Add link to home
            const homeLink = document.createElement('a');
            homeLink.href = `${basePath}index.html`;
            homeLink.textContent = 'Forsíða';
            homeLink.addEventListener('click', function(event) {
                event.preventDefault();
                history.pushState(null, '', `${basePath}index.html`);
                document.querySelector('main').innerHTML = `<p>${data.description}</p>`;
                document.querySelector('#lecture-content').innerHTML = '';
                document.title = data.title;
            });
            nav.appendChild(homeLink);

            // Add links for navigation (HTML, CSS, JavaScript)
            data.navigation.forEach(item => {
                const link = document.createElement('a');
                link.href = `${basePath}?section=${item.slug}`;
                link.textContent = item.title;

                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    const slug = item.slug;
                    history.pushState({ slug: slug }, '', `${basePath}?section=${slug}`);
                    loadOverview(slug); // Load overview instead of lectures
                });

                nav.appendChild(link);
            });

            // Set footer content
            document.querySelector('footer p').textContent = data.footer;

            // Handle initial load based on query parameters
            const params = new URLSearchParams(window.location.search);
            const section = params.get('section');
            const lecture = params.get('lecture');

            if (lecture && section) {
                history.replaceState({ section: section, lecture: lecture }, '', window.location.href);
                loadLecture(section, lecture);
            } else if (section) {
                history.replaceState({ slug: section }, '', window.location.href);
                loadOverview(section); // Load overview on section click
            } else {
                document.querySelector('main').innerHTML = `<p>${data.description}</p>`;
                document.title = data.title;
            }
        })
        .catch(error => console.error('Villa við að sækja index.json:', error));

    window.addEventListener('popstate', function(event) {
        if (event.state) {
            if (event.state.lecture) {
                loadLecture(event.state.section, event.state.lecture);
            } else if (event.state.slug) {
                loadOverview(event.state.slug); // Handle navigation back to overview
            }
        } else {
            document.querySelector('main').innerHTML = `<p>${window.appData.description}</p>`;
            document.title = window.appData.title;
        }
    });

    function loadOverview(sectionSlug) {
        const sectionPath = `${basePath}data/${sectionSlug}/index.json`;

        fetch(sectionPath)
            .then(response => response.json())
            .then(data => {
                document.title = `${data.title} - Vefforritunarvefurinn`;

                const main = document.querySelector('main');
                main.innerHTML = `<h2>${data.title}</h2><p>${data.text}</p>`;

                // Create links for the content options
                data.content.forEach(content => {
                    const section = document.createElement('section');
                    const h3 = document.createElement('h3');
                    const p = document.createElement('p');
                    const link = document.createElement('a');

                    h3.textContent = content.title;
                    p.textContent = content.text;
                    link.textContent = 'Lesa meira';
                    link.href = `${basePath}?section=${sectionSlug}&content=${content.slug}`;

                    link.addEventListener('click', function(event) {
                        event.preventDefault();

                        if (content.type === 'lectures') {
                            history.pushState({ section: sectionSlug, content: content.slug }, '', link.href);
                            loadSection(sectionSlug); // Load lectures
                        }
                        // Add similar handling for keywords, questions, etc., if needed.
                    });

                    section.appendChild(h3);
                    section.appendChild(p);
                    section.appendChild(link);
                    main.appendChild(section);
                });
            })
            .catch(error => console.error(`Villa við að sækja ${sectionSlug} gögn: ${error}`));
    }

    function loadSection(sectionSlug) {
        const sectionPath = `${basePath}data/${sectionSlug}/lectures.json`;

        fetch(sectionPath)
            .then(response => response.json())
            .then(data => {
                document.title = `${data.title} - Vefforritunarvefurinn`;

                const main = document.querySelector('main');
                main.innerHTML = `<h2>${data.title}</h2>`;

                // List lectures
                data.lectures.forEach(lecture => {
                    const section = document.createElement('section');
                    const h3 = document.createElement('h3');
                    const p = document.createElement('p');
                    const link = document.createElement('a');

                    h3.textContent = lecture.title;
                    p.textContent = `Fyrirlestur: ${lecture.title}`;
                    link.textContent = 'Lesa meira';
                    link.href = `${basePath}?section=${sectionSlug}&lecture=${lecture.slug}`;

                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        history.pushState({ section: sectionSlug, lecture: lecture.slug }, '', link.href);
                        loadLecture(sectionSlug, lecture.slug);
                    });

                    section.appendChild(h3);
                    section.appendChild(p);
                    section.appendChild(link);
                    main.appendChild(section);
                });
            })
            .catch(error => console.error(`Villa við að sækja ${sectionSlug} gögn: ${error}`));
    }

    function loadLecture(sectionSlug, lectureSlug) {
        const lecturePath = `${basePath}data/${sectionSlug}/lectures.json`;

        fetch(lecturePath)
            .then(response => response.json())
            .then(data => {
                const lecture = data.lectures.find(lecture => lecture.slug === lectureSlug);
                if (!lecture) {
                    console.error('Fyrirlestur fannst ekki');
                    return;
                }

                document.title = `${lecture.title} - ${data.title}`;
                const main = document.querySelector('main');
                main.innerHTML = `<h2>${lecture.title}</h2>`;

                // Render lecture content
                lecture.content.forEach(item => {
                    const section = document.createElement('section');

                    if (item.type === 'heading') {
                        const h3 = document.createElement('h3');
                        h3.textContent = item.data;
                        section.appendChild(h3);
                    } else if (item.type === 'text') {
                        const p = document.createElement('p');
                        p.textContent = item.data;
                        section.appendChild(p);
                    } else if (item.type === 'quote') {
                        const blockquote = document.createElement('blockquote');
                        blockquote.textContent = item.data;

                        if (item.attribute) {
                            const cite = document.createElement('cite');
                            cite.textContent = `— ${item.attribute}`;
                            blockquote.appendChild(cite);
                        }
                        section.appendChild(blockquote);
                    } else if (item.type === 'image') {
                        const img = document.createElement('img');
                        img.src = `${basePath}${item.data}`;
                        img.alt = item.caption || '';
                        section.appendChild(img);

                        if (item.caption) {
                            const figcaption = document.createElement('figcaption');
                            figcaption.textContent = item.caption;
                            section.appendChild(figcaption);
                        }
                    } else if (item.type === 'list') {
                        const ul = document.createElement('ul');
                        item.data.forEach(listItem => {
                            const li = document.createElement('li');
                            li.textContent = listItem;
                            ul.appendChild(li);
                        });
                        section.appendChild(ul);
                    } else if (item.type === 'code') {
                        const pre = document.createElement('pre');
                        const code = document.createElement('code');
                        code.textContent = item.data;
                        pre.appendChild(code);
                        section.appendChild(pre);
                    }

                    main.appendChild(section);
                });
            })
            .catch(error => console.error(`Villa við að sækja fyrirlestur: ${error}`));
    }
});
