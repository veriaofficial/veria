window.VeriaAvatar = {

    create: function(scene, options = {}) {

        const avatar = new THREE.Group();

        const skinColor = options.skin ?? 0xffc58a;
        const shirtColor = options.shirt ?? 0x3498db;
        const pantsColor = options.pants ?? 0x252525;
        const hairColor = options.hair ?? 0x38220f;

        function material(color) {
            return new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.8,
                metalness: 0
            });
        }

        function box(name, x, y, z, sx, sy, sz, color) {

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(sx, sy, sz),
                material(color)
            );

            mesh.name = name;
            mesh.position.set(x, y, z);

            avatar.add(mesh);

            return mesh;
        }

        // HEAD
        box(
            "Head",
            0,
            5.25,
            0,
            1.5,
            1.5,
            1.5,
            skinColor
        );

        // TORSO
        box(
            "Torso",
            0,
            3.65,
            0,
            2,
            1.8,
            1,
            shirtColor
        );

        // LEFT ARM
        box(
            "LeftArm",
            -1.5,
            3.65,
            0,
            1,
            1.8,
            1,
            shirtColor
        );

        // RIGHT ARM
        box(
            "RightArm",
            1.5,
            3.65,
            0,
            1,
            1.8,
            1,
            shirtColor
        );

        // LEFT LEG
        box(
            "LeftLeg",
            -0.5,
            1.8,
            0,
            1,
            1.9,
            1,
            pantsColor
        );

        // RIGHT LEG
        box(
            "RightLeg",
            0.5,
            1.8,
            0,
            1,
            1.9,
            1,
            pantsColor
        );

        // HAIR
        box(
            "Hair",
            0,
            6.05,
            0,
            1.6,
            0.35,
            1.6,
            hairColor
        );

        // FACE
        const face = material(0x111111);

        const leftEye = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.18,
                0.18,
                0.05
            ),
            face
        );

        leftEye.position.set(
            -0.3,
            5.35,
            -0.77
        );

        avatar.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.18,
                0.18,
                0.05
            ),
            face
        );

        rightEye.position.set(
            0.3,
            5.35,
            -0.77
        );

        avatar.add(rightEye);

        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.45,
                0.08,
                0.05
            ),
            face
        );

        mouth.position.set(
            0,
            5.0,
            -0.77
        );

        avatar.add(mouth);

        avatar.position.y = 0;

        avatar.userData.isVeriaAvatar = true;

        scene.add(avatar);

        return avatar;
    }
};
