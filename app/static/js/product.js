document.addEventListener('DOMContentLoaded', () => {
    const productPage = document.getElementById('product-page');
    if (!productPage) return;

    const sku = productPage.dataset.sku;
    let currentProduct = null;
    let currentImages = [];
    let currentImageIndex = 0;
    let selectedColor = null;
    let selectedSize = null;

    const mainImg = document.getElementById('main-product-image');
    const thumbnailRail = document.getElementById('thumbnail-rail');
    const imageCounter = document.getElementById('image-counter');
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productDesc = document.getElementById('product-description');
    const productShortDesc = document.getElementById('product-short-description');
    const productDetails = document.getElementById('product-details');
    const breadcrumbCat = document.getElementById('breadcrumb-category');
    const tagContainer = document.getElementById('tag-container');

    const fetchProduct = async (productSku) => {
        try {
            const res = await fetch(`/api/products/${productSku}`);
            if (!res.ok) throw new Error('Product not found');
            const data = await res.json();
            currentProduct = data;
            renderProduct();
            renderCarousels();
        } catch (err) {
            console.error(err);
            productName.textContent = 'Error loading product';
        }
    };

    const renderProduct = () => {
        productName.textContent = currentProduct.name;
        productPrice.textContent = `$${(currentProduct.base_price_cents / 100).toFixed(2)}`;
        productDesc.innerHTML = currentProduct.description || 'No description available.';
        productShortDesc.textContent = currentProduct.short_description || '';
        productDetails.innerHTML = currentProduct.details ? currentProduct.details.replace(/\n/g, '<br>') : 'No details available.';
        breadcrumbCat.textContent = currentProduct.category || 'Products';

        // Render Tags
        tagContainer.innerHTML = '';
        ['tag1', 'tag2', 'tag3'].forEach(t => {
            if (currentProduct[t]) {
                const span = document.createElement('span');
                span.className = 'badge rounded-pill bg-light text-dark border';
                span.textContent = currentProduct[t];
                tagContainer.appendChild(span);
            }
        });

        renderVariants();
        updateGallery();
    };

    const renderVariants = () => {
        const colors = [...new Set(currentProduct.variants.map(v => v.color_name))];
        const colorOpts = document.getElementById('color-options');
        colorOpts.innerHTML = '';
        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-secondary btn-sm';
            btn.textContent = color;
            btn.dataset.color = color;
            btn.onclick = () => selectColor(color);
            colorOpts.appendChild(btn);
        });

        if (colors.length > 0) selectColor(colors[0]);
    };

    const selectColor = (color) => {
        selectedColor = color;
        document.querySelectorAll('#color-options .btn').forEach(b => {
            b.classList.toggle('active', b.textContent === color);
            b.classList.toggle('btn-primary', b.textContent === color);
            b.classList.toggle('btn-outline-secondary', b.textContent !== color);
        });

        // Filter sizes for this color
        const availableSizes = currentProduct.variants
            .filter(v => v.color_name === color)
            .map(v => v.size);

        const sizeOpts = document.getElementById('size-options');
        sizeOpts.innerHTML = '';
        availableSizes.forEach(size => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-secondary btn-sm';
            btn.textContent = size;
            btn.dataset.size = size;
            btn.onclick = () => selectSize(size);
            sizeOpts.appendChild(btn);
        });

        if (availableSizes.length > 0) selectSize(availableSizes[0]);

        // Update gallery based on color variant
        const firstVariant = currentProduct.variants.find(v => v.color_name === color);
        if (firstVariant && firstVariant.images && firstVariant.images.length > 0) {
            currentImages = firstVariant.images;
        } else {
            currentImages = currentProduct.images;
        }
        currentImageIndex = 0;
        updateGallery();
    };

    const selectSize = (size) => {
        selectedSize = size;
        document.querySelectorAll('#size-options .btn').forEach(b => {
            b.classList.toggle('active', b.textContent === size);
            b.classList.toggle('btn-primary', b.textContent === size);
            b.classList.toggle('btn-outline-secondary', b.textContent !== size);
        });

        const variant = currentProduct.variants.find(v => v.color_name === selectedColor && v.size === size);
        if (variant) {
            productPrice.textContent = `$${(variant.final_price_cents / 100).toFixed(2)}`;
        }
    };

    const updateGallery = () => {
        if (currentImages.length === 0) return;

        mainImg.src = currentImages[currentImageIndex].url;
        imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;

        thumbnailRail.innerHTML = '';
        currentImages.forEach((img, idx) => {
            const thumb = document.createElement('img');
            thumb.src = img.url;
            thumb.className = `img-thumbnail cursor-pointer ${idx === currentImageIndex ? 'border-primary border-2' : ''}`;
            thumb.style.width = '100%';
            thumb.style.height = '80px';
            thumb.style.objectFit = 'cover';
            thumb.onclick = () => {
                currentImageIndex = idx;
                updateGallery();
            };
            thumbnailRail.appendChild(thumb);
        });
    };

    document.getElementById('prev-image').onclick = () => {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateGallery();
    };

    document.getElementById('next-image').onclick = () => {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateGallery();
    };

    const renderCarousels = async () => {
        const relatedBox = document.getElementById('related-products-carousel');
        const proposedBox = document.getElementById('proposed-products-carousel');

        const fetchList = async (skus, container) => {
            container.innerHTML = '';
            if (!skus || skus.length === 0) {
                container.innerHTML = '<p class="text-muted">No products found.</p>';
                return;
            }
            for (const s of skus) {
                try {
                    const r = await fetch(`/api/products/${s}`);
                    if (!r.ok) continue;
                    const p = await r.json();
                    const card = `
                        <div class="card border-0 shadow-sm flex-shrink-0" style="width: 220px;">
                            <a href="/product/${p.product_sku}" class="text-decoration-none">
                                <img src="${p.images[0]?.url}" class="card-img-top rounded" alt="${p.name}" style="height: 220px; object-fit: cover;">
                                <div class="card-body px-0">
                                    <h6 class="card-title text-dark mb-1 text-truncate">${p.name}</h6>
                                    <p class="text-primary fw-bold mb-0">$${(p.base_price_cents / 100).toFixed(2)}</p>
                                </div>
                            </a>
                        </div>
                    `;
                    container.innerHTML += card;
                } catch (e) {}
            }
        };

        fetchList(currentProduct.related_products, relatedBox);
        fetchList(currentProduct.proposed_products, proposedBox);
    };

    document.getElementById('add-to-cart-btn').onclick = async () => {
        const variant = currentProduct.variants.find(v => v.color_name === selectedColor && v.size === selectedSize);
        if (!variant) return alert('Please select a variant');

        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variant_sku: variant.sku, quantity: 1 })
        });
        if (res.ok) {
            window.location.href = '/cart';
        } else {
            alert('Failed to add to cart');
        }
    };

    fetchProduct(sku);
});
