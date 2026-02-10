
        const token = localStorage.getItem('token');
        if (!token) window.location.href = 'login.html';

        const form = document.getElementById('createTicketForm');
        const subjectInput = document.getElementById('subject');
        const descriptionInput = document.getElementById('description');
        const subjectCounter = document.getElementById('subjectCounter');
        const descriptionCounter = document.getElementById('descriptionCounter');
        const errorAlert = document.getElementById('errorAlert');
        const successAlert = document.getElementById('successAlert');
        const submitBtn = document.getElementById('submitBtn');

        // Character counters
        function updateCounter(input, counter, max) {
            const len = input.value.length;
            counter.textContent = len;
            const counterDiv = counter.parentElement;
            counterDiv.classList.toggle('warning', len > max * 0.9);
        }
        subjectInput.addEventListener('input', () => updateCounter(subjectInput, subjectCounter, 100));
        descriptionInput.addEventListener('input', () => updateCounter(descriptionInput, descriptionCounter, 1000));

        // Alerts
        function showError(msg) {
            errorAlert.textContent = msg;
            errorAlert.classList.remove('d-none');
            successAlert.classList.add('d-none');
        }
        function showSuccess() {
            successAlert.classList.remove('d-none');
            errorAlert.classList.add('d-none');
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const subject = subjectInput.value.trim();
            const description = descriptionInput.value.trim();
            const image = document.getElementById('image').files[0];

            if (!subject || !description) {
                return showError('Please fill in all required fields');
            }

            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('description', description);

            if (image) {
                formData.append('image', image);
            }

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML =
                    '<i class="fas fa-spinner fa-spin me-2"></i>Creating...';

                const res = await fetch('http://localhost:3000/api/tickets', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to create ticket');
                }

                showSuccess();

                setTimeout(() => {
                    window.location.href = 'mytickets.html';
                }, 3000);

            } catch (err) {
                showError(err.message);

                submitBtn.disabled = false;
                submitBtn.innerHTML =
                    '<i class="fas fa-plus-circle me-2"></i>สร้างตั๋ว';
            }
        });
