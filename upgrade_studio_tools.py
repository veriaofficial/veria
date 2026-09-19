from pathlib import Path
import shutil

TARGET = Path("index.html")

if not TARGET.exists():
    print("index.html was not found.")
    raise SystemExit(1)

text = TARGET.read_text(encoding="utf-8")

# Backup first
backup = Path("index.html.before_transform_tools.html")
shutil.copy2(TARGET, backup)

# -------------------------------------------------
# 1. Add TransformControls import
# -------------------------------------------------

old = 'import {OrbitControls} from "three/addons/controls/OrbitControls.js";'
new = old + '\nimport {TransformControls} from "three/addons/controls/TransformControls.js";'

if "TransformControls.js" not in text:
    if old not in text:
        print("Could not find OrbitControls import.")
        raise SystemExit(1)

    text = text.replace(old, new, 1)


# -------------------------------------------------
# 2. Add Move / Scale / Rotate toolbar
# -------------------------------------------------

anchor = """<div class="controls-help">
"""

toolbar = """<div class="transform-toolbar">

<button id="toolMove"
class="transform-tool active"
onclick="setTransformMode('translate')">
Move
</button>

<button id="toolScale"
class="transform-tool"
onclick="setTransformMode('scale')">
Scale
</button>

<button id="toolRotate"
class="transform-tool"
onclick="setTransformMode('rotate')">
Rotate
</button>

</div>

<div class="controls-help">
"""

if 'class="transform-toolbar"' not in text:

    if anchor not in text:
        print("Could not find Studio viewport controls.")
        raise SystemExit(1)

    text = text.replace(anchor, toolbar, 1)


# -------------------------------------------------
# 3. Add toolbar CSS
# -------------------------------------------------

css_anchor = """.controls-help{
"""

css = r"""
.transform-toolbar{
    position:absolute;
    top:12px;
    left:12px;
    display:flex;
    gap:6px;
    z-index:8;
    background:rgba(15,20,30,.92);
    border:1px solid #37435a;
    border-radius:8px;
    padding:6px;
    box-shadow:0 8px 24px rgba(0,0,0,.25);
}

.transform-tool{
    border:0;
    background:#252b3a;
    color:#dce3ef;
    border-radius:6px;
    padding:8px 12px;
    font-size:12px;
    font-weight:800;
}

.transform-tool:hover{
    background:#34405a;
}

.transform-tool.active{
    background:#5c8df6;
    color:white;
}

"""

if ".transform-toolbar{" not in text:

    if css_anchor not in text:
        print("Could not find controls-help CSS.")
        raise SystemExit(1)

    text = text.replace(css_anchor, css + css_anchor, 1)


# -------------------------------------------------
# 4. Add transformControls variable
# -------------------------------------------------

old = "let controls;"
new = "let controls;\nlet transformControls;"

if "let transformControls;" not in text:

    if old not in text:
        print("Could not find controls variable.")
        raise SystemExit(1)

    text = text.replace(old, new, 1)


# -------------------------------------------------
# 5. Add TransformControls after OrbitControls
# -------------------------------------------------

anchor = """controls.mouseButtons.MIDDLE=
        THREE.MOUSE.DOLLY;
"""

insert = """controls.mouseButtons.MIDDLE=
        THREE.MOUSE.DOLLY;


/* ROBLOX-STUDIO STYLE TRANSFORM GIZMO */

transformControls = new TransformControls(
    camera,
    renderer.domElement
);

transformControls.setMode("translate");
transformControls.setSize(1.1);

scene.add(transformControls.getHelper());

transformControls.addEventListener(
    "dragging-changed",
    event => {
        controls.enabled = !event.value;
    }
);

transformControls.addEventListener(
    "objectChange",
    () => {
        saveCurrentObjectTransform();
    }
);

"""

if "transformControls = new TransformControls" not in text:

    if anchor not in text:
        print("Could not find OrbitControls mouse settings.")
        raise SystemExit(1)

    text = text.replace(anchor, insert, 1)


# -------------------------------------------------
# 6. Add transform mode function
# -------------------------------------------------

anchor = """/* ==================================
   ANIMATION
================================== */
"""

functions = r"""/* ==================================
   TRANSFORM TOOLS
================================== */

window.setTransformMode = function(mode){

    if(!transformControls){
        return;
    }

    transformControls.setMode(mode);

    document
        .querySelectorAll(".transform-tool")
        .forEach(button=>{
            button.classList.remove("active");
        });

    if(mode==="translate"){
        document
            .getElementById("toolMove")
            ?.classList.add("active");
    }

    if(mode==="scale"){
        document
            .getElementById("toolScale")
            ?.classList.add("active");
    }

    if(mode==="rotate"){
        document
            .getElementById("toolRotate")
            ?.classList.add("active");
    }
};


function saveCurrentObjectTransform(){

    if(!currentGame || !selectedObjectId){
        return;
    }

    const object =
        scene.getObjectByName(
            selectedObjectId
        );

    if(!object){
        return;
    }

    const part =
        currentGame.parts?.find(
            p=>p.id===selectedObjectId
        );

    if(!part){
        return;
    }

    part.position = {
        x:object.position.x,
        y:object.position.y,
        z:object.position.z
    };

    part.rotation = {
        x:object.rotation.x,
        y:object.rotation.y,
        z:object.rotation.z
    };

    part.size = {
        x:object.scale.x * 2,
        y:object.scale.y * 2,
        z:object.scale.z * 2
    };
}


/* W = MOVE */
/* E = ROTATE */
/* R = SCALE */

window.addEventListener("keydown",event=>{

    if(
        event.target &&
        (
            event.target.tagName==="INPUT" ||
            event.target.tagName==="TEXTAREA"
        )
    ){
        return;
    }

    const key =
        event.key.toLowerCase();

    if(key==="w"){
        setTransformMode("translate");
    }

    if(key==="e"){
        setTransformMode("rotate");
    }

    if(key==="r"){
        setTransformMode("scale");
    }
});


/* ==================================
   ANIMATION
================================== */

"""

if "TRANSFORM TOOLS" not in text:

    if anchor not in text:
        print("Could not find animation section.")
        raise SystemExit(1)

    text = text.replace(anchor, functions, 1)


# -------------------------------------------------
# 7. Attach selected objects to gizmo
# -------------------------------------------------

old = """function selectObject(id){
"""

if old in text and "transformControls.attach" not in text:

    replacement = """function selectObject(id){

    selectedObjectId = id;

"""

    text = text.replace(old, replacement, 1)


# -------------------------------------------------
# 8. Add helper whenever a mesh is selected
# -------------------------------------------------

needle = """selectedObjectId=id;
"""

replacement = """selectedObjectId=id;

    if(transformControls){

        const selectedMesh =
            scene.getObjectByName(id);

        if(selectedMesh){

            transformControls.attach(
                selectedMesh
            );

        }
    }
"""

if "transformControls.attach" not in text:

    if needle in text:
        text = text.replace(
            needle,
            replacement,
            1
        )


# -------------------------------------------------
# 9. Keyboard shortcut safety
# -------------------------------------------------

if "contextmenu" not in text:

    anchor = """canvas.addEventListener(
        "pointerdown",
        onViewportClick
    );
"""

    replacement = """canvas.addEventListener(
        "pointerdown",
        onViewportClick
    );

canvas.addEventListener(
    "contextmenu",
    event => event.preventDefault()
);
"""

    if anchor in text:
        text = text.replace(
            anchor,
            replacement,
            1
        )


# -------------------------------------------------
# SAVE
# -------------------------------------------------

TARGET.write_text(
    text,
    encoding="utf-8"
)

print("")
print("================================")
print(" VERIA STUDIO UPDATED")
print("================================")
print("")
print("Move  = W")
print("Rotate = E")
print("Scale = R")
print("")
print("Backup:")
print(backup)
print("")
print("HOME SCREEN WAS NOT REPLACED.")
print("")
